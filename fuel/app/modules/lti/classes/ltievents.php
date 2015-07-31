<?php

namespace Lti;
use \RocketDuck\Log;

class UnknownUserException extends \Fuel\Core\FuelException {}
class UnknownAssignmentException extends \Fuel\Core\FuelException {}
class InvalidOAuthRequestException extends \Fuel\Core\FuelException {}

class LtiEvents
{
	const PLAY_STATE_FIRST_LAUNCH = 'first_launch';
	const PLAY_STATE_REPLAY = 'replay';
	const PLAY_STATE_NOT_LTI = 'not_lti';

	protected static function get_lti_play_state($play_id = false)
	{
		//Is there a resource_link_id? Then this is an LTI launch
		if (\Input::param('resource_link_id', false)) return self::PLAY_STATE_FIRST_LAUNCH;

		//Do we have a token? Then this is a replay
		if (\Input::param('token', false))    return self::PLAY_STATE_REPLAY;

		//Ok, nothing in Input, so we have to dig deeper.
		//Do we have a play_id? If no, then assume not in an LTI
		if ( ! $play_id) return self::PLAY_STATE_NOT_LTI;

		//Do we have variables stored by the given play_id?
		//We only store variables by the first play ID, so this is the first attempt
		$launch = \Session::get("lti-{$play_id}", false);
		if($launch) return self::PLAY_STATE_FIRST_LAUNCH;

		//Do we have variables that are *linked* to the given play_id?
		//We only do this for replays, so this is a replay
		$token = \Session::get("lti-link-{$play_id}", false);
		$launch = \Session::get("lti-{$token}", false);
		if($launch) return self::PLAY_STATE_REPLAY;

		//Nothing in the request, nothing in the session, assume not an LTI launch
		return self::PLAY_STATE_NOT_LTI;
	}

	public static function on_before_play_start_event($payload)
	{
		extract($payload); // exposes $inst_id and $is_embedded

		switch(static::get_lti_play_state())
		{
			case self::PLAY_STATE_NOT_LTI:
				return [];

			case self::PLAY_STATE_FIRST_LAUNCH:
				// We need to validate this launch
				$launch = Lti::get_launch_from_request();

				if ( ! \Lti\Oauth::validate_post()) throw new InvalidOAuthRequestException();
				if ( ! LtiUserManager::authenticate($launch)) throw new UnknownUserException();
				if ( ! $inst_id) throw new UnknownAssignmentException();
				break;

			case self::PLAY_STATE_REPLAY:
				$token = \Input::param('token', false);
				$launch = static::session_get_launch($token);
				break;
		}

		if (LtiUserManager::is_lti_user_a_content_creator($launch))
		{
			return ['redirect' => "/lti/success/{$inst_id}"];
		}

		$launch->inst_id = $inst_id;
		static::save_lti_association_if_needed($launch);

		return [];
	}

	public static function on_play_start_event($payload)
	{
		extract($payload); // exposes $inst_id and $play_id

		switch(static::get_lti_play_state($play_id))
		{
			case self::PLAY_STATE_NOT_LTI:
				return;

			case self::PLAY_STATE_FIRST_LAUNCH:
				$is_embedded = is_array(\Uri::segments()) && !in_array('play', \Uri::segments());
				static::store_lti_request_into_session($play_id, $inst_id, $is_embedded);
				break;

			case self::PLAY_STATE_REPLAY:
				$token = \Input::param('token');
				// link replay
				\Session::set("lti-link-{$play_id}", $token);
				break;
		}

		static::log($play_id, 'session-init');
	}

	/**
	 * FUEL EVENT Fired by the score manager when it saves a score from the 'score_updated' event
	 * @param array [0] is an instance id, [1] is the student user_id, [2] is the score
	 * @return boolean True if successfully sent to the requester
	 */
	public static function on_send_score_event($event_args)
	{
		list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;

		if(static::get_lti_play_state($play_id) == self::PLAY_STATE_NOT_LTI) return false; //@TODO - is this supposed to return false????

		$launch = static::session_get_launch($play_id);
		$secret   = \Config::get("lti::lti.consumers.{$launch->consumer}.secret", false);

		if ( ! ($max_score >= 0) || empty($launch->inst_id) || empty($launch->source_id) || empty($launch->service_url) || empty($secret))
		{
			static::log($play_id, 'outcome-no-passback', $max_score);
			return false; //@TODO - when uncommented, caused errors (still need to test)
		}

		$max_score = (int) $max_score / 100;
		$view_data = [
			'score'     => $max_score,
			'message'   => uniqid(),
			'source_id' => $launch->source_id
		];

		$body = \Theme::instance()->view('lti/partials/outcomes_xml', $view_data)->render();
		$success = Oauth::send_body_hashed_post($launch->service_url, $body, $secret);

		static::log($play_id, 'outcome-'.($success ? 'success':'failure'), $max_score);

		return $success;
	}

	/**
	 * FUEL EVENT fired by API when play_logs_save recieves an 'end' event.
	 * @param  $play The completed play that is now expired.
	 */
	public static function on_play_completed_event($play)
	{
		if(static::get_lti_play_state($play->id) == self::PLAY_STATE_NOT_LTI) return [];

		$launch = static::session_get_launch($play->id);

		$embed_url_segment = $launch->is_embedded ? 'embed/' : '/';
		return ['score_url' => "/scores/{$embed_url_segment}{$play->inst_id}?token={$launch->token}#play-{$play->id}"];
	}

	/**
	 * FUEL EVENT fired by a widget instance when db_remove is called.
	 * @param $inst_id The ID of the deleted instance
	 */
	public static function on_widget_instance_delete_event($inst_id)
	{
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();

		if (count($lti_data) > 0)
		{
			$lti_assoc = $lti_data[0];
			Log::profile(['Deleting association for '.$inst_id], 'lti-assoc');
			Log::profile([print_r($lti_assoc, true)], 'lti-assoc');

			\DB::delete('lti')->where('item_id', $inst_id)->execute();
		}
	}

	protected static function session_get_launch($play_id)
	{
		$launch = \Session::get("lti-{$play_id}", false);
		if($launch) return $launch;

		$token = \Session::get("lti-link-{$play_id}", false);
		return \Session::get("lti-{$token}", false);
	}

	protected function set_vars_from_session($token)
	{
		$this->vars = \Session::get("lti-{$this->token}", false);
	}

	protected static function store_lti_request_into_session($token, $inst_id, $is_embedded)
	{
		$launch = Lti::get_launch_from_request();
		$launch->token = $token;
		$launch->inst_id = $inst_id;
		$launch->is_embedded = $is_embedded;
		\Session::set("lti-{$token}", $launch);
	}

	protected static function save_lti_association_if_needed($launch)
	{
		// if the configuration says we don't save associations, just return now
		if ( ! \Config::get("lti::lti.consumers.{$launch->consumer}.save_assoc", true)) return true;

		// Search for any associations with this item id and resource link
		$assoc = Lti::find_assoc_from_resource_id($launch->resource_id);

		// If a matching lti association is found, nothing needs to be done
		if ($assoc && $assoc->item_id == $launch->inst_id) return true;

		// Insert a new association
		$saved = static::save_lti_association($launch, $assoc);

		if ( ! $saved)
		{
			$this->log('error-saving-association', $_SERVER['REQUEST_URI']);
		}

		return $saved;
	}

	protected static function save_lti_association($launch, $assoc = false)
	{
		// if nothing exists, create a new one
		if ( ! $assoc) $assoc = Model_Lti::forge();

		$assoc->resource_link = $launch->resource_id;
		$assoc->consumer_guid = $launch->consumer_id;
		$assoc->item_id       = $launch->inst_id;
		$assoc->user_id       = \Model_User::find_current_id();
		$assoc->consumer      = $launch->consumer;
		$assoc->name          = $launch->fullname;
		$assoc->context_id    = $launch->context_id;
		$assoc->context_title = $launch->context_title;

		return $assoc->save();
	}

	protected static function log($play_id)
	{
		$current_user = \Model_User::find_current();
		$args = func_get_args();
		array_shift($args);
		$launch = static::session_get_launch($play_id);

		$standard_args = [
			':',
			$current_user->id,
			$current_user->username,
			$launch->inst_id,
			$launch->service_url,
			$launch->source_id,
			$launch->resource_id,
			$launch->context_id,
			$launch->context_title,
			$launch->consumer_id,
			$play_id
		];

		$log_array = array_merge($args, $standard_args);

		Log::profile($log_array, 'lti');
	}
}
