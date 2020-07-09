<?php

class MateriaAuthUserUpdateException extends \FuelException {}

class Auth_Login_Materiaauth extends Auth_Login_Simpleauth
{

	static public function update_role($user_id, $is_employee = false)
	{
		$user = \Model_User::find($user_id);

		// grab our user first to see if overrrideRoll has been set to 1
		if ($user instanceof \Model_User)
		{
			// add employee role
			if ($is_employee)
			{
				return \Materia\Perm_Manager::add_users_to_roles_system_only([$user->id], [\Materia\Perm_Role::AUTHOR]);
			}
			// not an employee anymore, remove role
			else
			{
				return \Materia\Perm_Manager::remove_users_from_roles_system_only([$user->id], [\Materia\Perm_Role::AUTHOR]);
			}
		}
	}

	public function logout()
	{
		$this->user = \Config::get('simpleauth.guest_login', true) ? static::$guest_login : false;
		\Session::delete('username');
		\Session::delete('login_hash');

		if ( ! \Fuel::$is_cli)
		{
			Response::redirect('');
		}
	}

	/**
	 * Create new user
	 *
	 * @param   string username
	 * @param   string password
	 * @param   string email
	 * @param   int    group id
	 * @param   Array  profile fields
	 * @param   string first name
	 * @param   string last name
	 * @param   bool   requires password
	 * @param   bool   requires email
	 * @return  bool
	 */
	public function create_user($username, $password, $email = '', $group = 1, Array $profile_fields = [], $first_name = '', $last_name = '', $requires_password = true, $requires_email = true)
	{
		$first_name = trim($first_name);
		$last_name  = trim($last_name);
		$username   = trim($username);
		$email      = filter_var(trim($email), FILTER_VALIDATE_EMAIL);

		if (empty($username) or ($requires_password && empty($password)))
		{
			throw new \SimpleUserUpdateException('Username or password is not given', 1);
		}

		if ($requires_email && ! $email)
		{
			throw new \SimpleUserUpdateException('Email not given', 2);
		}

		// just get the first user that has the same username or email
		$same_user = \Model_User::query()->where('username', '=', $username);
		if ($email) $same_user->or_where('email', '=', $email);
		$same_user = $same_user->get_one();

		if ($same_user)
		{
			if (strcasecmp($email, $same_user->email) == 0)
			{
				throw new \SimpleUserUpdateException("Email address already exists {$same_user->email}", 2);
			}
			else
			{
				throw new \SimpleUserUpdateException("Username already exists {$same_user->username}", 3);
			}
		}

		$user = \Model_User::forge([
			'username'        => (string) $username,
			'first'           => (string) $first_name,
			'last'            => (string) $last_name,
			'password'        => ( ! $requires_password && empty($password) ? '' : $this->hash_password((string) $password)),
			'email'           => $email,
			'group'           => (int) $group,
			'profile_fields'  => $profile_fields,
			'last_login'      => 0,
			'login_hash'      => '',
		]);

		// save the new user record
		try
		{
			$result = $user->save();
		}
		catch (\Exception $e)
		{
			$result = false;
		}

		// return the id of the created user, or false if creation failed
		return $result ? $user->id : false;
	}

	/**
	 * Update a user's properties
	 * Note: Username cannot be updated, to update password the old password must be passed as old_password
	 *
	 * @param   Array  properties to be updated including profile fields
	 * @param   string
	 * @return  bool
	 */
	public function update_user($values, $username = null)
	{
		if ( ! $username)
		{
			if ( ! $this->user) throw new \SimpleUserUpdateException('No username or user provided.', 4);
			$username = $this->user['username'];
		}

		$user = \Model_User::find_by_username($username);

		if ( ! $user) throw new \SimpleUserUpdateException("Username {$username} not found", 4);

		$current_values = $user->to_array();
		$update = [];
		if (array_key_exists('username', $values))
		{
			throw new \SimpleUserUpdateException('Username cannot be changed.', 5);
		}

		if (array_key_exists('password', $values))
		{
			unset($values['password']);
		}

		if (array_key_exists('email', $values))
		{
			$email = filter_var(trim($values['email']), FILTER_VALIDATE_EMAIL);
			if ( ! $email)
			{
				// currently and empty email, use a default
				if (empty($current_values['email']))
				{
					throw new \SimpleUserUpdateException('No email was defined.', 3);
				}
				else
				{
					// current not empty, keep using it
					$email = $current_values['email'];
				}
			}
			if ($current_values['email'] != $email)
			{
				$update['email'] = $email;
			}
			unset($values['email']);
		}

		if (array_key_exists('group', $values))
		{
			if (is_numeric($values['group']))
			{
				$update['group'] = (int) $values['group'];
			}
			unset($values['group']);
		}

		if (array_key_exists('first', $values))
		{
			$first = trim($values['first']);
			if ( ! empty($first) && $current_values['first'] != $first)
			{
				$update['first'] = (string) $first;
			}
			unset($values['first']);
		}

		if (array_key_exists('last', $values))
		{
			$last = trim($values['last']);
			if ( ! empty($last) && $current_values['last'] != $last)
			{
				$update['last'] = (string) $last;
			}
			unset($values['last']);
		}

		if ( ! empty($values))
		{
			$profile_fields = @unserialize($current_values['profile_fields']) ?: [];
			foreach ($values as $key => $val)
			{
				if ($val === null)
				{
					unset($profile_fields[$key]);
				}
				else
				{
					$profile_fields[$key] = $val;
				}
			}
			$update['profile_fields'] = serialize($profile_fields);
		}

		if ( ! empty($update))
		{
			// save the new user record
			try
			{
				$user->set($update);
				$user->save();
			}
			catch (\Exception $e)
			{
				return false;
			}

			// refresh our user
			if ($this->user['username'] == $username) $this->user = $user->to_array();
		}

		return true;
	}

}
