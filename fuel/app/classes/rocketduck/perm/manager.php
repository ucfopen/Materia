<?php
namespace RocketDuck;

class Perm_Manager
{
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param string NEEDS DOCUMENTATION
	 */
	static public function create_role($role_name = '')
	{
		if ( ! Perm_Manager::is_administrator()) return false;
		if ($role_name == '' || ! is_string($role_name)) return false;
		if (Perm_Manager::role_exists($role_name)) return false;
		if (strlen($role_name) > 255 ) return false;

		list($id, $num) = \DB::insert('user_role')
			->set(['name' => $role_name])
			->execute();

		return $num > 0;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param string NEEDS DOCUMENTATION
	 */
	static public function delete_role($role_name = '')
	{
		if ( ! Perm_Manager::is_administrator()) return false;
		if ($role_name == '' || ! is_string($role_name)) return false;
		if (($role_id = Perm_Manager::get_role_id($role_name)) == 0) return false;

		try
		{
			\DB::start_transaction();
			// delete role
			\DB::delete('user_role')
				->where('role_id', $role_id)
				->execute();

			// delete user <-> role mapping
			\DB::delete('perm_role_to_user')
				->where('role_id', $role_id)
				->execute();

			// delete role <-> permission mapping
			\DB::delete('perm_role_to_perm')
				->where('role_id', $role_id)
				->execute();

			\DB::commit_transaction();
			return true;
		}
		catch (Exception $e)
		{
			\DB::rollback_transaction();
		}

		return false;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param string NEEDS DOCUMENTATION
	 * @param string NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static public function add_users_to_role($user_ids = '', $role_name = '')
	{
		if ( ! Perm_Manager::is_administrator()) return false;
		return Perm_Manager::add_users_to_role_system_only($user_ids, $role_name);
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param string NEEDS DOCUMENTATION
	 * @param string NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static public function add_users_to_role_system_only($user_ids = '', $role_name = '')
	{
		if ($user_ids == '' || ! is_array($user_ids) || $role_name == '' || ! is_string($role_name)) return false;
		if (($role_id = Perm_Manager::get_role_id($role_name)) == 0) return false;
		foreach ($user_ids as $key => $user_id)
		{
			if ( ! is_numeric($user_id)) return false;

			list($id, $num) = \DB::query(
				'INSERT IGNORE
					INTO '.\DB::quote_table('perm_role_to_user').'
					SET user_id = :user_id,
					role_id = :role_id',
				\DB::INSERT)
				->param('user_id', $user_id)
				->param('role_id', $role_id)
				->execute();

			return $num > 0;
		}

	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param int NEEDS DOCUMENTATION
	 * @param string NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static public function add_user_to_role($user_id = 0, $role_name = '')
	{
		if ($user_id == 0 || ! is_numeric($user_id) || $role_name == '' || ! is_string($role_name)) return false;
		$user_ids = [];
		$user_ids[] = $user_id;
		return Perm_Manager::add_users_to_role($user_ids, $role_name);
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 *
	 * @todo FIX RETURN FOR DB ABSTRACTION
	 */
	static public function get_all_roles()
	{
		if ( ! Perm_Manager::is_administrator()) return false;

		$results = \DB::select()
			->from('user_role')
			->as_object()
			->execute()
			->as_array();

		if (count($results) > 0) return $results;

		return false;
	}

	/**
	 * NEEDS DOCUMENATION
	 *
	 * @param int NEEDS DOCUMENTATION
	 *
	 * @todo FIX RETURN FOR DB ABSTRACTION
	 */
	static public function get_user_roles($user_id = 0)
	{
		$q = \DB::select('r.role_id', 'r.name')
			->from(['user_role', 'r'])
			->join(['perm_role_to_user', 'm'])
				->on('r.id', '=', 'm.role_id')
			->as_object();

		// return logged in user's roles if id is 0 or less, non su users can only use this method
		if ($user_id <= 0 || $user_id == \Model_User::find_current_id())
		{
			$roles = [];

			$results = $q->where('m.user_id', \Model_User::find_current_id())
				->execute();

			if ($results->count() > 0)
			{
				foreach ($results as $r)
				{
					$roles[] = $r;
				}
			}
		}
		// su can return a anyone's roles
		else
		{
			if (Perm_Manager::is_super_user())
			{
				$results = $q->where('m.user_id', $user_id)
					->execute();

				if ($results->count() > 0)
				{
					foreach ($results as $r)
					{
						$roles[] = $r;
					}
				}
			}
			else
			{
				trace(' not super user.', true);
				return false;
			}
		}
		return $roles;
	}

	/**
	 * Returns true if user has any
	 *	If no uid is sent, default to the current user
	 *
	 * @notes does a user have one of the given roles?
	 *
	 * @param array	role names
	 * @param int	Optional user_id, defaults to the current session uid
	 *
	 * @return bool	True if user has any of the passed roles, false if no roles match
	 *
	 * @author Ian Turgeon
	 **/
	static public function does_user_have_role($roles, $user_id=null)
	{
		$length = count($roles);
		if ($length == 0) return false;
		// if using current user
		if ($user_id === null || ! \Materia\Util_Validator::is_pos_int($user_id))
		{
			$user_id = \Model_User::find_current_id();
		}

		// get a list of all the role IDs
		$role_ids = [];
		foreach  ($roles as $role)
		{
			$role_ids[] = (string) Perm_Manager::get_role_id($role);
		}

		$results = \DB::select(\DB::expr('COUNT(*) as count'))
			->from('perm_role_to_user')
			->where('user_id', $user_id)
			->where('role_id', 'IN', $role_ids)
			->execute();

		return $results->count() > 0 && $results[0]['count'] != 0;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @var string NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static public function get_role_id($role_name = '')
	{
		if ($role_name == '' || ! is_string($role_name)) return 0;
		if ( ! Perm_Manager::role_exists($role_name)) return 0;

		$results = \DB::select('role_id')
			->from('user_role')
			->where('name', $role_name)
			->execute();

		if ($results->count() > 0)
		{
			return $results[0]['role_id'];
		}
		else
		{
			return false;
		}
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @var string NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static private function role_exists($role_name = '')
	{
		if ($role_name == '' || ! is_string($role_name)) return false;

		$results = \DB::select(\DB::expr('COUNT(*) as count'))
			->from('user_role')
			->where('name', $role_name)
			->execute();

		return $results->count() > 0 && $results[0]['count'] > 0;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param array NEEDS DOCUMENTATION
	 * @param array NEEDS DOCUMENTATION
	 *
	 * @return bool NEEDS DOCUMENTATION
	 */
	static public function remove_users_from_roles($users = '', $roles = '')
	{
		// This needs to be executable by the system
		if ( ! Perm_Manager::is_administrator()) return false;
		return Perm_Manager::remove_users_from_roles_system_only($users, $roles);
	}

	/**
	 * This function is only for the system to call, it ignores administrator rights
	 *
	 * @param array NEEDS DOCUMENTATION
	 * @param array NEEDS DOCUMENTATION
	 *
	 * @return bool NEEDS DOCUMENTATION
	 */
	static public function remove_users_from_roles_system_only($users = '', $roles ='')
	{
		if ($users == '' || $roles == '' || ! is_array($users) || ! is_array($roles)) return false;
		$success = true;

		// @TODO: make this one query instead of a whole bunch
		foreach  ($users as $user_id)
		{
			foreach ($roles as $role_name)
			{
				\DB::delete('perm_role_to_user')
					->where('user_id', $user_id)
					->where('role_id', Perm_Manager::get_role_id($role_name))
					->execute();
			}
		}
		return $success;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @return NEEDS DOCUMENTATION
	 *
	 * @author Zachary Berry
	 */
	static public function add_users_to_roles($users = '', $roles = '')
	{
		if ( ! Perm_Manager::is_administrator()) return false;
		return Perm_Manager::add_users_to_roles_system_only($users, $roles);
	}

	/**
	 * This function is only for the system to call, it ignores administrator rights
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @return NEEDS DOCUMENTATION
	 *
	 * @author Zachary Berry
	 */
	static public function add_users_to_roles_system_only($users = '', $roles ='')
	{
		if ( ! is_array($users) || ! is_array($roles)) return false;
		$success = true;

		foreach ($users as $user_id)
		{
			foreach ($roles as $role_name)
			{
				$role_number = Perm_Manager::get_role_id($role_name);
				if ( ! $role_number)
				{
					$success = false;
					continue;
				}

				list($id, $num) = \DB::query('INSERT IGNORE
					INTO '.\DB::quote_table('perm_role_to_user').'
					SET user_id = :user_id,
					role_id = :role_id',
					\DB::INSERT)
					->param('user_id', $user_id)
					->param('role_id', $role_number)
					->execute();

				if ($num < 1)
				{
					$success = false;
				}
			}
		}

		return $success;
	}

	static public function is_administrator()
	{
		$has_role = \Session::get('is_administrator', false) || \Fuel::$is_cli;
		if ($has_role === false)
		{
			$has_role = Perm_Manager::does_user_have_role([\Materia\Perm_Role::SU]);
			\Session::set('is_administrator', $has_role);
		}
		return $has_role;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @return unknown NEEDS DOCUMENTATION
	 */
	static public function is_super_user()
	{
		$login_hash = \Session::get('login_hash');
		$key = 'is_super_user_'.$login_hash;
		$has_role = \Session::get($key, null) || (\Fuel::$is_cli && \Fuel::$env != \Fuel::TEST);

		if ($has_role == null)
		{
			$has_role = Perm_Manager::does_user_have_role([\Materia\Perm_Role::SU]);
			\Session::set($key, $has_role);
		}
		return $has_role;
	}
}
