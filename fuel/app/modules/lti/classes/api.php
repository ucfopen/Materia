<?php

namespace Lti;
use \RocketDuck\Log;
use \RocketDuck\Util_Validator;

class Api
{
	protected static $lti_vars;

	/**
	 * FUEL EVENT Fired by the score manager when it saves a score from the 'score_updated' event
	 * @param array [0] is an instance id, [1] is the student user_id, [2] is the score
	 * @return boolean True if successfully sent to the requester
	 */
	public static function on_send_score_event($event_args)
	{
		list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;

		$lti_data = static::session_get_lti_data($play_id);
		$consumer = $lti_data['consumer'];
		$secret   = \Config::get("lti::lti.consumers.$consumer.secret", false);

		return self::send_score_to_lti_consumer($max_score, $inst_id, $lti_data['source_id'], $lti_data['service_url'], $secret);
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

	/**
	 * FUEL EVENT fired by API when play_logs_save recieves an 'end' event.
	 * @param  $play The completed play that is now expired.
	 */
	public static function on_play_completed_event($play)
	{
		// retrieve lti token if this is part of an lti play, allowing the user
		// to replay this widget
		$lti_data = static::session_get_lti_data($play->id);
		static::session_unlink_lti_token_to_play($play->id);

		if ($lti_data['token'])
		{
			$inst_id = $play->inst_id;
			$lti_token = $lti_data['token'];

			return ['score_url' => "/scores/embed/$inst_id?ltitoken=$lti_token#play-$play->id"];
		}

		return [];
	}

	/**
	 * Sends LIS Basic Outcomes Service call for ReplaceResult which sets the score of the associated item
	 * @param $score Score String or number of the score, 0-100
	 * @param $sourceID SourceID The source id of the item to set the score for - passed to us via LTI oauth message
	 */
	protected static function send_score_to_lti_consumer($score, $inst_id, $source_id, $service_url, $secret)
	{
		if ( ! ($score >= 0) || empty($inst_id) || empty($source_id) || empty($service_url) || empty($secret))
		{
			Log::profile(['outcome-no-passback', $inst_id, \Model_User::find_current_id(), $service_url, $score, $source_id], 'lti');
			return false;
		}

		$score = (int) $score / 100;
		$view_data = [
			'score'     => $score,
			'message'   => uniqid(),
			'source_id' => $source_id
		];

		$body = \Theme::instance()->view('lti/partials/outcomes_xml', $view_data)->render();
		$success = Oauth::send_body_hashed_post($service_url, $body, $secret);

		Log::profile(['outcome-'.($success ? 'success':'failure'), $inst_id, \Model_User::find_current_id(), $service_url, $score, $source_id], 'lti');
		return $success;
	}

	/**
	 * Can the user create stuff based on the LTI role sent via post
	 * @return String Role depending on input
	 */
	public static function lti_user_is_content_creator()
	{
		$staff_roles   = ['Administrator', 'Instructor', 'ContentDeveloper', 'urn:lti:role:ims/lis/TeachingAssistant'];
		$student_roles = ['Student', 'Learner'];

		$launch_roles = explode(',', \Input::post('roles'));

		if (count(array_intersect($launch_roles, $staff_roles))) return true;
		if (count(array_intersect($launch_roles, $student_roles))) return false;

		// log a user that has no identified roles
		Log::profile(['no-known-role', \Input::post('roles')], 'lti-error');
		return false;
	}

	/**
	 * Creates a user based on data passed to Materia from an LTI consumer.
	 * If the consumer config looks up user by username, misses, but a matching email address is found:
	 * The username is optionally updated with the update_existing flag
	 * If the consuemr config looks up users by email, misses, but a matching username is found:
	 * The email is optionally updated with the update_existing flag
	 *
	 * @param  object  $launch              the launch vars
	 * @param  string  $search_field        user field to search in
	 * @param  string  $auth_driver         FuelPHP Auth driver to use
	 * @param  boolean $creates_users       Create & update the user if it doesnt exist
	 * @return mixed                        Either return a Model_User or false if the user couldnt be found or created
	 */
	public static function get_or_create_user($launch, $search_field, $auth_driver, $creates_users = false)
	{
		// allow any auth module that needs to look up external users to create them as needed
		\Event::trigger('lti_get_or_create_user', $launch->username, 'json');
		$auth = \Auth::instance($auth_driver);

		if( ! $auth)
		{
			throw new \Exception("Unable to find auth driver for $auth_driver");
		}

		if ($user = \Model_User::query()->where($search_field, $launch->remote_id)->get_one())
		{
			// User already exists, so update?
			if ($creates_users) static::update_user_from_launch_user($user, $launch, $auth);

			static::update_user_roles($user, $launch, $auth);

			return $user;
		}

		if ($creates_users)
		{
			try
			{
				$user_id = $auth->create_user($launch->username, uniqid(), $launch->email, 1, ['created_by' => $launch->consumer_id]);
				if ($user_id)
				{
					$user = \Model_User::find($user_id);

					static::update_user_from_launch_user($user, $launch, $auth);

					static::update_user_roles($user, $launch, $auth);

					return $user;
				}
				Log::profile(['unable-to-create-user', $launch->username, $launch->email], 'lti-error');
			}
			catch (\SimpleUserUpdateException $e)
			{
				Log::profile(['create-user-failed', $launch->username, $launch->email, $e->getMessage()], 'lti-error');
			}
		}

		Log::profile(['unable-to-locate-user', $launch->username, $launch->email], 'lti-error');
		return false;
	}

	protected static function update_user_from_launch_user(\Model_User $user, $launch, $auth)
	{
		// items to update in the user if we need to
		$items_to_update = [];

		if ( empty($user->first)) $items_to_update['first'] = $launch->first;
		if ( empty($user->last))  $items_to_update['last'] = $launch->last;
		// NOTE: Since emails are generated if none exist then this value will
		// not be empty when we expect it to.
		if ( empty($user->email)) $items_to_update['email'] = $launch->email;

		if ( ! empty($items_to_update)) $auth->update_user($items_to_update, $user->username);
	}

	/**
	 * Update user roles
	 * @param   \Model_User $user User to update
	 * @return  void
	 */
	protected static function update_user_roles(\Model_User $user, $launch, $auth)
	{
		if(\Config::get("lti::lti.consumers.{$launch->consumer}.use_launch_roles") && method_exists($auth, 'update_role'))
		{
			$auth->update_role($user->id, static::lti_user_is_content_creator());
		}
	}

	/**
	 * Use this to authenticate a user based on LTI parameters, checks oauth validity too
	 * @return boolean true if successful
	 */
	public static function authenticate()
	{
		// =================== LOAD COFIGURATION ============================
		$launch = static::get_launch_vars();
		$local_id_field     = \Config::get("lti::lti.consumers.$launch->consumer.local_identifier", 'username');
		$auth_driver        = \Config::get("lti::lti.consumers.$launch->consumer.auth_driver", '');
		$creates_users      = \Config::get("lti::lti.consumers.$launch->consumer.creates_users");

		// Check for the test user first
		if ($launch->first === 'Test' && $launch->last === 'Student' && in_array('Learner', $launch->roles))
		{
			$launch->username = $launch->remote_id = 'teststudent';
			$launch->email    = "testuser@{$launch->consumer}.com";
			$creates_users = true;
		}

		if (empty($launch->remote_id) || empty($launch->username) || empty($launch->consumer))
		{
			Log::profile(['auth-data-missing', $launch->remote_id, $launch->username, $launch->consumer, \Input::post('resource_link_id')], 'lti');
			return false;
		}

		$valid = Oauth::validate_post();

		Log::profile([$launch->remote_id, 'lti', $valid?'yes':'no'], 'login');
		if ( ! $valid) return false;

		$user = static::get_or_create_user($launch, $local_id_field, $auth_driver, $creates_users);

		if ($user instanceof \Model_User)
		{
			return (bool) \Auth::instance($auth_driver)->force_login($user->id);
		}

		\Auth::logout();
		return false;
	}

	/**
	 * Gets the widget associated with the parameters sent via LTI Post
	 * @param object Lti launch variables
	 * @return string widget instance id OR NULL if not found
	 */
	protected static function find_widget_from_resource_id($resource_id)
	{
		return Model_Lti::query()->where('resource_link', $resource_id)->get_one();
	}

	public static function is_lti_launch()
	{
		return  \Input::post('resource_link_id', false) && \Input::post('tool_consumer_instance_guid', false);
	}

	public static function get_launch_vars()
	{
		if (isset(static::$lti_vars)) return static::$lti_vars;

		// these are configurable to let username and user_id come from custom launch variables
		$consumer          = trim(\Input::post('tool_consumer_info_product_family_code', false));
		$remote_id_field   = trim(\Config::get("lti::lti.consumers.$consumer.remote_identifier", 'username'));
		$remote_user_field = trim(\Config::get("lti::lti.consumers.$consumer.remote_username", 'user_id'));

		// trim all the roles
		$roles = explode(',', \Input::post('roles'));
		$roles = array_map( function($role) { return trim($role); }, $roles);

		static::$lti_vars = (object) [
			'source_id'      => trim(\Input::post('lis_result_sourcedid', false)), // the unique id for this course&context&user&launch used for returning scores
			'service_url'    => trim(\Input::post('lis_outcome_service_url', false)), // where to send score data back to, can be blank if not supported
			'resource_id'    => trim(\Input::post('resource_link_id', false)), // unique placement of this tool in the consumer
			'context_id'     => trim(\Input::post('context_id', false)),
			'context_title'  => trim(\Input::post('context_title', false)),
			'consumer_id'    => trim(\Input::post('tool_consumer_instance_guid', false)), // unique install id of this tool
			'consumer'       => $consumer,
			'custom_inst_id' => trim(\Input::post('custom_widget_instance_id', false)), // Some tools will pass which inst_id they want
			'email'          => trim(\Input::post('lis_person_contact_email_primary')),
			'last'           => trim(\Input::post('lis_person_name_family', '')),
			'first'          => trim(\Input::post('lis_person_name_given', '')),
			'fullname'       => trim(\Input::post('lis_person_name_full', '')),
			'roles'          => $roles,
			'remote_id'      => trim(\Input::post($remote_id_field)),
			'username'       => trim(\Input::post($remote_user_field)),

		return static::$lti_vars;
	}

	// This function is mostly used in testing, since we might need to modify
	// the launch vars multiple times and get_launch_vars returns a cached
	// value
	public static function clear_launch_vars()
	{
		static::$lti_vars = null;
	}

	public static function create_lti_association_if_needed($item_id, $launch)
	{
		// Search for any associations with this item id and resource link
		$association_for_item_id_and_resource_link = Model_Lti::find('all', [
			'where' => [
				['item_id', $item_id],
				['resource_link', $launch->resource_id]
			],
			'limit' => 1
		]);

		// If a matching lti association is found, nothing needs to be done
		if (count($association_for_item_id_and_resource_link)) return true;

		// if the configuration says we don't save associations, just return now
		if ( ! \Config::get("lti::lti.consumers.{$launch->consumer}.save_assoc", true)) return true;

		// Insert a new association
		return static::save_resource_to_widget_association($item_id, $launch);
	}

	protected static function save_resource_to_widget_association($inst_id, $launch)
	{
		$assoc = static::find_widget_from_resource_id($launch->resource_id);

		// if nothing exists, create a new one
		if ( ! $assoc) $assoc = new Model_Lti();

		$assoc->resource_link = $launch->resource_id;
		$assoc->consumer_guid = $launch->consumer_id;
		$assoc->item_id       = $inst_id;
		$assoc->user_id       = \Model_User::find_current_id();
		$assoc->consumer      = $launch->consumer;
		$assoc->name          = $launch->fullname;
		$assoc->context_id    = $launch->context_id
		$assoc->context_title = $launch->context_title;

		return $assoc->save();
	}

	public static function session_save_lti_data($launch, $play_id)
	{
		$token = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Session::set("lti.$token.consumer", $launch->consumer );
		\Session::set("lti.$token.outcome_url", $launch->service_url);
		\Session::set("lti.$token.resource_link_id", $launch->resource_id);
		\Session::set("lti.$token.lis_result_sourcedid", $launch->source_id);

		static::session_link_lti_token_to_play($token, $play_id);
	}

	public static function session_get_lti_data($play_id)
	{
		$token = \Session::get("lti-{$play_id}", false);

		return [
			'consumer'         => \Session::get("lti.$token.consumer", false),
			'service_url'      => \Session::get("lti.$token.outcome_url", false),
			'resource_link_id' => \Session::get("lti.$token.resource_link_id", false),
			'source_id'        => \Session::get("lti.$token.lis_result_sourcedid", false),
			'token'            => $token,
		];
	}

	public static function session_link_lti_token_to_play($token, $play_id)
	{
		\Session::set("lti-{$play_id}", $token);
	}

	public static function session_unlink_lti_token_to_play($play_id)
	{
		\Session::delete("lti-{$play_id}");
	}

	// grabs the widget instance id from the post/get variables
	// Returns FALSE or a valid instance id
	public static function get_widget_from_request()
	{
		// return if widget is in post/get
		$inst_id = \Input::get('widget');
		if (Util_Validator::is_valid_hash($inst_id)) return $inst_id;

		// return if custom_inst_id is valid
		$launch = static::get_launch_vars();
		if (Util_Validator::is_valid_hash($launch->custom_inst_id)) return $launch->custom_inst_id;

		// return if we can find it's association in the database
		if ($assoc = static::find_widget_from_resource_id($launch->resource_id))
		{
			if (Util_Validator::is_valid_hash($assoc->item_id)) return $assoc->item_id;
		}

		return false;
	}

	/**
	 * Start up a student's interaction with a widget using passed LTI Params
	 *
	 * If $inst_id is passed then we'll try to use that.
	 * If $inst_id is invalid then we'll try to use the custom-inst-id POST parameter
	 * If none of these work, then we'll try to look it up based on the resource link
	 * Finally, if all of these fail then we fail.
	 *
	 * @return string Widget Instance ID of the appropriate widget OR False if it cant be found
	 */
	public static function init_assessment_session($inst_id)
	{
		$inst_id = static::get_widget_from_request();

		if ( ! $inst_id)
		{
			Log::profile(['instance-id-not-found', $inst_id, $_SERVER['REQUEST_URI'], \Model_User::find_current_id(), $launch->service_url, $launch->source_id], 'lti');
		}

		$launch  = static::get_launch_vars();
		if ( ! static::create_lti_association_if_needed($inst_id, $launch))
		{
			Log::profile(['error-saving-lti-association', $inst_id, $_SERVER['REQUEST_URI'], \Model_User::find_current_id(), $launch->service_url, $launch->source_id], 'lti');
		}

		// Create the play session
		$play_id = \Materia\Api::session_play_create($inst_id);

		// session_play_create returned an error msg
		if ( $play_id instanceof \RocketDuck\Msg)
		{
			return $play_id;
		}

		static::session_save_lti_data($launch, $play_id);

		Log::profile(['session-init', $inst_id, $play_id, \Model_User::find_current_id(), $launch->service_url, '', $launch->source_id], 'lti');

		return (object) ['play_id' => $play_id, 'inst_id' => $inst_id];
	}
}
