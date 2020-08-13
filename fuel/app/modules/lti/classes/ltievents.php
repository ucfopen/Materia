<?php

namespace Lti;
use \Materia\Log;
use \Materia\Util_Validator;

class LtiEvents
{
	const PLAY_STATE_FIRST_LAUNCH = 'first_launch';
	const PLAY_STATE_REPLAY = 'replay';
	const PLAY_STATE_NOT_LTI = 'not_lti';
	protected static $inst_id;

	public static function on_before_play_start_event($payload)
	{
		if (static::get_lti_play_state() == self::PLAY_STATE_FIRST_LAUNCH)
		{
			extract($payload); // exposes event args $inst_id and $is_embedded
			if ( ! $inst_id) $inst_id = static::get_widget_from_request();
			$inst = \Materia\Widget_Instance_Manager::get($inst_id);

			$redirect = false;

			$launch = LtiLaunch::from_request();

			if ($inst_id && $inst && LtiUserManager::is_lti_user_a_content_creator($launch))
			{
				if ($inst->guest_access)
				{
					$redirect = '/lti/error/guest_mode';
				}
				else
				{
					if ($inst_id && $inst)
					{
						$launch->inst_id = $inst_id;
						static::save_lti_association_if_needed($launch);
					}
					$redirect = "/lti/success/{$inst_id}";
				}
			}

			if ( ! \Lti\Oauth::validate_post()) $redirect = '/lti/error?message=invalid_oauth_request';
			elseif ( ! LtiUserManager::authenticate($launch)) $redirect = '/lti/error/unknown_user';
			elseif ( ! $inst_id || ! $inst) $redirect = '/lti/error/unknown_assignment';
			elseif ($inst->guest_access) $redirect = '/lti/error/guest_mode';
			//if we got here through an LTI, it's an assignment (likely) using grade passback
			//assignments passing back a grade can't be non-autoplaying, since grade passback doesn't work
			elseif (isset($_GET['autoplay']) && $_GET['autoplay'] === 'false') $redirect = '/lti/error/autoplay_misconfigured';

			if ($redirect) return ['redirect' => $redirect];

			$launch->inst_id = $inst_id;
			static::save_lti_association_if_needed($launch);

			return ['inst_id' => $inst_id, 'context_id' => $launch->context_id, 'force_embedded' => ! $payload['is_embedded']];
		}
		elseif (static::get_lti_play_state() == self::PLAY_STATE_REPLAY)
		{
			$token = \Input::param('token');
			$launch = static::session_get_launch($token);
			return ['context_id' => $launch->context_id];
		}
		return [];
	}

	public static function on_play_start_event($payload)
	{
		extract($payload); // exposes $inst_id and $play_id
		switch (static::get_lti_play_state($play_id))
		{
			case self::PLAY_STATE_NOT_LTI:
				return;

			case self::PLAY_STATE_FIRST_LAUNCH:
				$is_embedded = isset($payload['context_id']) && ! empty($payload['context_id']);
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

	public static function on_before_score_display_event($token)
	{
		if (static::get_lti_play_state($token) == self::PLAY_STATE_NOT_LTI) return false;
		return static::session_get_launch($token)->context_id;
	}

	/**
	 * FUEL EVENT Fired by the score manager when it saves a score from the 'score_updated' event
	 * @param array [0] is an instance id, [1] is the student user_id, [2] is the score
	 * @return boolean True if successfully sent to the requester
	 */
	public static function on_score_updated_event($event_args)
	{
		list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;

		if (static::get_lti_play_state($play_id) == self::PLAY_STATE_NOT_LTI) return false; //@TODO - is this supposed to return false????

		$launch = static::session_get_launch($play_id);
		$secret   = \Config::get("lti::lti.consumers.{$launch->consumer}.secret", false);
		$key      = \Config::get("lti::lti.consumers.{$launch->consumer}.key", false);

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
		$success = Oauth::send_body_hashed_post($launch->service_url, $body, $secret, $key);

		static::log($play_id, 'outcome-'.($success ? 'success' : 'failure'), $max_score);

		return $success;
	}

	/**
	 * FUEL EVENT fired by API when play_logs_save recieves an 'end' event.
	 * @param  $play The completed play that is now expired.
	 */
	public static function on_play_completed_event($play)
	{
		if (static::get_lti_play_state($play->id) == self::PLAY_STATE_NOT_LTI) return [];

		$launch = static::session_get_launch($play->id);

		$embed_url_segment = $launch->is_embedded ? 'embed/' : '/';
		return ['score_url' => "/scores/{$embed_url_segment}{$play->inst_id}?token={$launch->token}#play-{$play->id}"];
	}

	/**
	 * FUEL EVENT fired by a widget instance when db_remove is called.
	 * @param array $event_args containing inst_id and deleted_by_id keys.
	 */
	public static function on_widget_instance_delete_event($event_args)
	{
		$inst_id = $event_args['inst_id'];

		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();

		if (count($lti_data) > 0)
		{
			$lti_assoc = $lti_data[0];
			Log::profile(['Deleting association for '.$inst_id], 'lti-assoc');
			Log::profile([print_r($lti_assoc, true)], 'lti-assoc');

			\DB::delete('lti')->where('item_id', $inst_id)->execute();
		}
	}

	// grabs the widget instance id from the post/get variables
	// @return FALSE or a valid instance id
	protected static function get_widget_from_request()
	{
		if ( isset(static::$inst_id)) return static::$inst_id;

		$request_widget         = \Input::param('widget', false);
		$request_custom_inst_id = \Input::param('custom_widget_instance_id', false);
		$request_resource_id    = \Input::param('resource_link_id', false);

		// return one of the values from POST/GET, if valid
		if (Util_Validator::is_valid_hash($request_widget)) return $request_widget;
		if (Util_Validator::is_valid_hash($request_custom_inst_id)) return $request_custom_inst_id;

		// return if we can find its association in the database
		$assoc = static::find_assoc_from_resource_id($request_resource_id);
		if ( $assoc && Util_Validator::is_valid_hash($assoc->item_id)) return $assoc->item_id;

		return false;
	}

	/**
	 * Gets the Model_Lti associated with a resource id
	 * @param string An LTI resource id
	 * @return Model_Lti or NULL if none found
	 */
	protected static function find_assoc_from_resource_id($resource_id)
	{
		return Model_Lti::query()->where('resource_link', $resource_id)->get_one();
	}

	protected static function get_lti_play_state($play_id = false)
	{
		//Is there a resource_link_id? Then this is an LTI launch
		if (\Input::param('resource_link_id')) return self::PLAY_STATE_FIRST_LAUNCH;

		//Do we have a token? Then this is a replay
		if (\Input::param('token')) return self::PLAY_STATE_REPLAY;

		//Ok, nothing in Input, so we have to dig deeper.
		//Do we have a play_id? If no, then assume not in an LTI
		if ( ! $play_id) return self::PLAY_STATE_NOT_LTI;

		//Do we have variables stored by the given play_id?
		//We only store variables by the first play ID, so this is the first attempt
		$launch = \Session::get("lti-{$play_id}", false);
		if ($launch) return self::PLAY_STATE_FIRST_LAUNCH;

		//Do we have variables that are *linked* to the given play_id?
		//We only do this for replays, so this is a replay
		$token = \Session::get("lti-link-{$play_id}", false);
		$launch = \Session::get("lti-{$token}", false);
		if ($launch) return self::PLAY_STATE_REPLAY;

		//Nothing in the request, nothing in the session, assume not an LTI launch
		return self::PLAY_STATE_NOT_LTI;
	}

	protected static function session_get_launch($play_id)
	{
		$launch = \Session::get("lti-{$play_id}", false);
		if ($launch) return $launch;

		$token = \Session::get("lti-link-{$play_id}", false);
		return \Session::get("lti-{$token}", false);
	}

	protected static function store_lti_request_into_session($token, $inst_id, $is_embedded)
	{
		$launch = LtiLaunch::from_request();
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
		$assoc = static::find_assoc_from_resource_id($launch->resource_id);

		// If a matching lti association is found, nothing needs to be done
		if ($assoc && $assoc->item_id == $launch->inst_id) return true;

		// Insert a new association
		$saved = static::save_lti_association($launch, $assoc);

		if ( ! $saved) static::log('error-saving-association', $_SERVER['REQUEST_URI']);

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
