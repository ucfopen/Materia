<?php

namespace Lti;

class Api
{
	/**
	 * FUEL EVENT Fired by the score manager when it saves a score from the 'score_updated' event
	 * @param array [0] is an instance id, [1] is the student user_id, [2] is the score 
	 * @return boolean True if successfully sent to the requester
	 */
	public static function on_send_score_event($event_args)
	{
		list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;

		$lti_data = static::retrieve_lti_data($play_id);
		$consumer = $lti_data['consumer'];
		$secret   = \Config::get("lti::lti.consumers.$consumer.secret", false);

		return self::send_score($max_score, $inst_id, $lti_data['source_id'], $lti_data['service_url'], $secret);
	}

	/**
	 * FUEL EVENT fired by a widget instance when db_remove is called.
	 * @param $inst_id The ID of the deleted instance
	 */
	public static function on_widget_instance_delete($inst_id)
	{
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();

		if (count($lti_data) > 0)
		{
			$lti_assoc = $lti_data[0];
			\RocketDuck\Log::profile(['Deleting association for '.$inst_id], 'lti-assoc');
			\RocketDuck\Log::profile([print_r($lti_assoc, true)], 'lti-assoc');

			\DB::delete('lti')->where('item_id', $inst_id)->execute();
		}
	}

	/**
	 * FUEL EVENT fired by API when play_logs_save recieves an 'end' event.
	 * @param  $play The completed play that is now expired.
	 */
	public static function on_play_completed($play)
	{
		// retrieve lti token if this is part of an lti play, allowing the user
		// to replay this widget
		$lti_data = static::retrieve_lti_data($play->id);
		static::disassociate_lti_data($play->id);

		if ($lti_data['token'])
		{
			$inst_id = $play->inst_id;
			$lti_token = $lti_data['token'];

			return ['score_url' => "/scores/embed/$inst_id?ltitoken=$lti_token"];
		}

		return [];
	}

	/**
	 * Sends LIS Basic Outcomes Service call for ReplaceResult which sets the score of the associated item
	 * @param $score Score String or number of the score, 0-100
	 * @param $sourceID SourceID The source id of the item to set the score for - passed to us via LTI oauth message
	 */
	protected static function send_score($score, $inst_id, $source_id, $service_url, $secret)
	{
		if ( ! ($score >= 0) || empty($inst_id) || empty($source_id) || empty($service_url) || empty($secret))
		{
			\RocketDuck\Log::profile(['outcome-no-passback', $inst_id, \Model_User::find_current_id(), $service_url, $score, $source_id], 'lti');
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

		\RocketDuck\Log::profile(['outcome-'.($success ? 'success':'failure'), $inst_id, \Model_User::find_current_id(), $service_url, $score, $source_id], 'lti');
		return $success;
	}

	/**
	 * Get the LTI role of the user sent via post
	 * @return String Role depending on input
	 */
	public static function get_role()
	{
		$roles = explode(',', \Input::post('roles'));

		if (in_array('Administrator', $roles)) return 'Administrator';
		if (in_array('Instructor', $roles)) return 'Instructor';
		if (in_array('ContentDeveloper', $roles)) return 'Instructor';
		if (in_array('urn:lti:role:ims/lis/TeachingAssistant', $roles)) return 'Instructor';
		if (in_array('Learner', $roles)) return 'Learner';
		if (in_array('Student', $roles)) return 'Student';
		return 'None';
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
	protected static function get_or_create_user($launch, $search_field, $auth_driver, $creates_users = false)
	{
		// allow any auth module that needs to look up external users to create them as needed
		\Event::trigger('lti_get_or_create_user', $launch->username, 'json');

		if ($user = \Model_User::find()->where($search_field, $launch->remote_id)->get_one())
		{
			// User already exists, so update?
			if ($creates_users)
			{
				static::update_user($user, $launch->username, $launch->first, $launch->last, $launch->email);
			}

			static::update_user_roles($user);

			return $user;
		}

		if ($creates_users)
		{
			try
			{
				$consumer_id = \Input::post('tool_consumer_instance_guid');
				if ($user_id = \Auth::instance($auth_driver)->create_user($launch->username, uniqid(), $launch->email, 1, ['created_by' => $consumer_id]))
				{
					$user = \Model_User::find($user_id);

					static::update_user_roles($user);

					return $user;
				}
				else
				{
					\RocketDuck\Log::profile(['unable-to-create-user', $launch->username, $launch->email], 'lti-error');
				}
			}
			catch (\SimpleUserUpdateException $e)
			{
				\RocketDuck\Log::profile(['create-user-failed', $launch->username, $launch->email, $e->getMessage()], 'lti-error');
			}
		}

		return false;
	}

	/**
	 * Update the user's data
	 * @param  \Model_User  $user  User to update
	 * @param  string  $username   New username
	 * @param  string  $first      New First Name
	 * @param  string  $last       New Last Name
	 * @param  string  $email      New Email Address
	 * @return void
	 */
	protected static function update_user(\Model_User $user, $username, $first, $last, $email)
	{
		// Update the user:
		$user->username = $username;
		$user->email    = $email;
		$user->first    = $first;
		$user->last     = $last;

		$user->save();
	}

	/**
	 * Update user roles
	 * @param   \Model_User $user User to update
	 * @return  void
	 */
	protected static function update_user_roles(\Model_User $user)
	{
		$launch = static::get_launch_vars();

		if(\Config::get("lti::lti.consumers.$launch->consumer.use_launch_roles", false))
		{
			// add or remove basic_author role
			if (in_array(self::get_role(), ['Administrator', 'Instructor']))
			{
				\RocketDuck\Perm_Manager::add_users_to_roles_system_only([$user->id], ['basic_author']);
			}
			else
			{
				\RocketDuck\Perm_Manager::remove_users_from_roles_system_only([$user->id], ['basic_author']);
			}
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
			$launch->email    = "testuser@$launch->consumer.com";
			$creates_users = true;
		}

		if (empty($launch->remote_id) || empty($launch->username) || empty($launch->email) || empty($launch->consumer))
		{
			\RocketDuck\Log::profile(['auth-data-missing', $launch->remote_id, $launch->username, $launch->email, $launch->consumer, \Input::post('resource_link_id')], 'lti');
			return false;
		}

		$valid = Oauth::validate_post();

		\RocketDuck\Log::profile([$launch->remote_id, 'lti', $valid?'yes':'no'], 'login');
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
	 * @return string widget instance id OR false if not found
	 */
	public static function get_widget_association($launch)
	{
		return Model_Lti::query()->where('resource_link', $launch->resource_id)->get_one();
	}

	public static function is_lti_launch()
	{
		return  \Input::post('resource_link_id', false) && \Input::post('tool_consumer_instance_guid', false);
	}

	protected static function get_launch_vars()
	{
		// these are configurable to let username and user_id come from custom launch variables
		$consumer          = \Input::post('tool_consumer_info_product_family_code', false);
		$remote_id_field   = \Config::get("lti::lti.consumers.$consumer.remote_identifier", 'username');
		$remote_user_field = \Config::get("lti::lti.consumers.$consumer.remote_username", 'user_id');

		return (object) [
			'source_id'      => \Input::post('lis_result_sourcedid', false), // the unique id for this course&context&user&launch used for returning scores
			'service_url'    => \Input::post('lis_outcome_service_url', false), // where to send score data back to, can be blank if not supported
			'resource_id'    => \Input::post('resource_link_id', false), // unique placement of this tool in the consumer
			'context_id'     => \Input::post('context_id', false),
			'context_title'  => \Input::post('context_title', false),
			'consumer_id'    => \Input::post('tool_consumer_instance_guid', false), // unique install id of this tool
			'consumer'       => $consumer,
			'custom_inst_id' => \Input::post('custom_widget_instance_id', false), // Some tools will pass which inst_id they want
			'email'          => \Input::post('lis_person_contact_email_primary'),
			'last'           => \Input::post('lis_person_name_family'),
			'first'          => \Input::post('lis_person_name_given'),
			'fullname'       => \Input::post('lis_person_name_full'),
			'roles'          => explode(',', \Input::post('roles')),
			'remote_id'      => \Input::post($remote_id_field),
			'username'       => \Input::post($remote_user_field),
		];
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
		if (count($association_for_item_id_and_resource_link) > 0)
		{
			return true;
		}

		// Insert a new association
		return static::save_widget_association($item_id, $launch);
	}

	public static function save_widget_association( $inst_id, $launch)
	{
		// if the configuration says we don't save associations, just return now
		if ( ! \Config::get("lti::lti.consumers.".$launch->consumer.".save_assoc", true)) return true;

		// ================== CHECK FOR ASSOCIATION ======================
		$association = static::get_widget_association($launch);

		// if nothing exists, create a new one
		if ( ! $association)
		{
			$association = new Model_Lti();
			$association->resource_link = $launch->resource_id;
			$association->consumer_guid = $launch->consumer_id;
		}

		// update
		$association->item_id          = $inst_id;
		$association->user_id          = \Model_User::find_current_id();
		$association->consumer         = $launch->consumer;
		$association->name             = isset($launch->fullname) ? $launch->fullname : '';
		$association->context_id       = isset($launch->context_id) ? $launch->context_id : '';
		$association->context_title    = isset($launch->context_title) ? $launch->context_title : '';

		return $association->save();
	}

	public static function store_lti_data($launch, $play_id)
	{
		$token = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Session::set("lti.$token.consumer", $launch->consumer );
		\Session::set("lti.$token.outcome_url", $launch->service_url);
		\Session::set("lti.$token.resource_link_id", $launch->resource_id);
		\Session::set("lti.$token.lis_result_sourcedid", $launch->source_id);

		static::associate_lti_data($token, $play_id);
	}

	public static function retrieve_lti_data($for_play_id)
	{
		$token = \Session::get("lti-$for_play_id", false);

		return [
			'consumer'         => \Session::get("lti.$token.consumer", false),
			'service_url'      => \Session::get("lti.$token.outcome_url", false),
			'resource_link_id' => \Session::get("lti.$token.resource_link_id", false),
			'source_id'        => \Session::get("lti.$token.lis_result_sourcedid", false),
			'token'            => $token,
		];
	}

	public static function associate_lti_data($token, $for_play_id)
	{
		\Session::set("lti-$for_play_id", $token);
	}

	public static function disassociate_lti_data($for_play_id)
	{
		\Session::delete("lti-$for_play_id");
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
		$launch = static::get_launch_vars();

		if (empty($launch->resource_id) || empty($launch->consumer_id))
		{
			\RocketDuck\Log::profile(['session-post-missing', $inst_id, \Model_User::find_current_id(), $launch->service_url, $launch->source_id], 'lti');
			return false;
		}

		// $inst_id may be invalid, however, we'll still accept an inst_id via post
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id) && \RocketDuck\Util_Validator::is_valid_hash($launch->custom_inst_id))
		{
			$inst_id = $launch->custom_inst_id;
		}

		// If inst_id is still invalid then we need to see if we can look it up
		// (Perhaps it's an older ifrit URL?)
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id))
		{
			$association = static::get_widget_association($launch);
			$inst_id = $association ? $association->item_id : false;
		}

		// ============ FAIL IF WE HAVNT FOUND A WIDGET ========================
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id))
		{
			\RocketDuck\Log::profile(['session-init-failure', $inst_id, $launch->custom_inst_id, $_SERVER['REQUEST_URI'], \Model_User::find_current_id(), $launch->service_url, $launch->source_id], 'lti');
			return false;
		}

		if ( ! static::create_lti_association_if_needed($inst_id, $launch))
		{
			return false;
		}

		// Create the play session
		$play_id = \Materia\Api::session_play_create($inst_id);

		if ( $play_id instanceof \RocketDuck\Msg)
		{
			return $play_id;
		}

		static::store_lti_data($launch, $play_id);

		\RocketDuck\Log::profile(['session-init', $inst_id, $play_id, \Model_User::find_current_id(), $launch->service_url, '', $launch->source_id], 'lti');

		return (object) ['play_id' => $play_id, 'inst_id' => $inst_id];
	}
}