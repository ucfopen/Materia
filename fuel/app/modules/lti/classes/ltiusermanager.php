<?php

namespace Lti;
use \Materia\Log;

class LtiUserManager
{
	/**
	 * Use this to authenticate a user based on LTI parameters, checks oauth validity too
	 * @return boolean true if successful
	 */
	public static function authenticate($launch)
	{
		// =================== LOAD COFIGURATION ============================
		$cfg            = LtiLaunch::config();
		$local_id_field = $cfg['local_identifier'] ?? 'username';
		$auth_driver    = $cfg['auth_driver'] ?? '';
		$creates_users  = $cfg['creates_users'] ?? true;


		// Check for the test user first
		if ($launch->first === 'Test' && $launch->last === 'Student' && in_array('Learner', $launch->roles))
		{
			$launch->username = $launch->remote_id = 'teststudent';
			$launch->email    = "testuser@{$launch->consumer}.com";
			$creates_users = true;
		}

		if (empty($launch->remote_id) || empty($launch->username) || empty($launch->consumer))
		{
			Log::profile(['auth-data-missing', $launch->remote_id, $launch->username, $launch->consumer, \Input::param('resource_link_id')], 'lti');
			return false;
		}

		$user = static::get_or_create_user($launch, $local_id_field, $auth_driver, $creates_users);

		if ($user instanceof \Model_User)
		{
			// Force clear the session if the session username doesn't match the currently authenticated user. Otherwise we may encounter problems with
			// stale LTI data being used if two students use the same computer
			if ($user->username != \Session::get('username'))
			{
				try
				{
					\Session::destroy();
					\Session::start();
				}
				catch (\Fuel\Core\FuelException $e)
				{
					// If there was no session, Fuel throws a memcached exception. This is fine.
				}
			}

			// For some reason unkown to us - passing the authdriver here causes a strange error on production
			// The user can start playing a widget, but the playid is registered to userid 0
			// But for testing, we need to be able to specify the auth driver
			if ( ! \Fuel::$is_test) $auth_driver = null;
			return (bool) \Auth::instance($auth_driver)->force_login($user->id);
		}

		\Auth::logout();
		return false;
	}

	/**
	 * Can the user create stuff based on the LTI role sent via post
	 * @return String Role depending on input
	 */
	public static function is_lti_user_a_content_creator($launch)
	{
		$staff_roles   = ['Administrator', 'Instructor', 'ContentDeveloper', 'urn:lti:role:ims/lis/TeachingAssistant'];
		$student_roles = ['Student', 'Learner'];

		if (count(array_intersect($launch->roles, $staff_roles))) return true;
		if (count(array_intersect($launch->roles, $student_roles))) return false;

		// log a user that has no identified roles
		Log::profile(['no-known-role', \Input::param('roles')], 'lti-error');
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
	protected static function get_or_create_user($launch, $search_field, $auth_driver, $creates_users = false)
	{
		// allow any auth module that needs to look up external users to create them as needed
		\Event::trigger('lti_get_or_create_user', $launch->username, 'json');
		$auth = \Auth::instance($auth_driver);

		if ( ! $auth)
		{
			throw new \Exception("Unable to find auth driver for $auth_driver");
		}

		// UPDATE EXISTING USER
		if ($user = \Model_User::query()->where($search_field, $launch->remote_id)->get_one())
		{
			// User already exists, so update?
			if ($creates_users) static::update_user_from_lti_request($user, $launch, $auth);

			static::update_user_roles($user, $launch, $auth);

			return $user;
		}

		// CREATE NEW USER
		if ($creates_users)
		{
			try
			{
				//username, password, email, group, profile fields, first name, last name, requires password, requires email
				$user_id = $auth->create_user(
					$launch->username,
					uniqid(),
					$launch->email,
					1,
					['created_by' => $launch->consumer_id],
					$launch->first,
					$launch->last,
					false,
					false
				);
				if ($user_id)
				{
					$user = \Model_User::find($user_id);

					static::update_user_from_lti_request($user, $launch, $auth);

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

	/**
	 * Update user roles
	 * @param   \Model_User $user User to update
	 * @return  void
	 */
	protected static function update_user_roles(\Model_User $user, $launch, $auth)
	{
		$cfg = LtiLaunch::config();
		if ($cfg['use_launch_roles'] && method_exists($auth, 'update_role'))
		{
			$auth->update_role($user->id, static::is_lti_user_a_content_creator($launch));
		}
	}

	protected static function update_user_from_lti_request(\Model_User $user, $launch, $auth)
	{
		// items to update in the user if we need to
		$items_to_update = [];

		if ( empty($user->first)) $items_to_update['first'] = $launch->first;
		if ( empty($user->last))  $items_to_update['last'] = $launch->last;
		// NOTE: Since emails are generated if none exist then this value will
		// not be empty when we expect it to.
		if (empty($user->email) && ! empty($launch->email)) $items_to_update['email'] = $launch->email;
		if ( ! empty($items_to_update)) $auth->update_user($items_to_update, $user->username);
	}
}
