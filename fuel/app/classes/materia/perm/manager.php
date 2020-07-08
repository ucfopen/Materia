<?php

namespace Materia;

class Perm_Manager
{

	/**
	 * Create a new Role
	 *
	 * @param string $role_name role name with no spaces, snake case w/ underscores
	 *
	 * @return boolean whether or not a new role was created, or false if the role
	 * does not exist or the current user is not a super user
	 */
	static public function create_role($role_name = '')
	{
		if ( ! self::is_super_user()) return false;
		if (empty($role_name) || ! is_string($role_name)) return false;
		if (self::role_exists($role_name)) return false;
		if (strlen($role_name) > 255 ) return false;

		list($id, $num) = \DB::insert('user_role')
			->set(['name' => $role_name])
			->execute();

		return $num > 0;
	}

	/**
	 * Checks if the currently logged in user is a super user
	 *
	 * @return boolean whether or not the current user has the super user role as defined by the Perm_Role class
	 */
	static public function is_super_user()
	{
		$login_hash = \Session::get('login_hash');
		$key = 'is_super_user_'.$login_hash;
		$has_role = (\Fuel::$is_cli === true && ! \Fuel::$is_test) || \Session::get($key, false);

		if ( ! $has_role)
		{
			$has_role = self::does_user_have_role([\Materia\Perm_Role::SU]);
			\Session::set($key, $has_role);
		}
		return $has_role;
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
	 **/
	static public function does_user_have_role(Array $roles, $user_id = null)
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
			$role_ids[] = (string) self::get_role_id($role);
		}

		$results = \DB::select(\DB::expr('COUNT(*) as count'))
			->from('perm_role_to_user')
			->where('user_id', $user_id)
			->where('role_id', 'IN', $role_ids)
			->execute();

		return $results->count() > 0 && $results[0]['count'] != 0;
	}

	/**
	 * Return a list of users who have the given role.
	 *
	 * @param string $role_name role name with no spaces, snake case w/ underscores
	 *
	 * @return array list of user ids with role $role_name
	 */
	static public function get_user_ids_with_role($role_name = '')
	{
		if (empty($role_name) || ! is_string($role_name) || ! self::role_exists($role_name)) return [];

		$role_id = self::get_role_id($role_name);

		$result = \DB::select('user_id')
			->from('perm_role_to_user')
			->where('role_id', $role_id)
			->execute();

		$user_ids = [];
		foreach ($result as $row)
		{
			$user_ids[] = $row['user_id'];
		}

		return $user_ids;
	}

	/**
	 * Check to see if a role with the given name already exists
	 *
	 * @param string $role_name role name with no spaces, snake case w/ underscores
	 *
	 * @return boolean whether or not the given role name is already present in the database
	 */
	static private function role_exists($role_name = '')
	{
		if (empty($role_name) || ! is_string($role_name)) return false;

		$results = \DB::select(\DB::expr('COUNT(*) as count'))
			->from('user_role')
			->where('name', $role_name)
			->execute();

		return $results->count() > 0 && $results[0]['count'] > 0;
	}


	/**
	 * Get the id of a role with the given name
	 *
	 * @param string $role_name role name with no spaces, snake case w/ underscores
	 *
	 * @return boolean false if no role with the given name exists in the database
	 * @return integer the id in the database of the role with the given name
	 */
	static public function get_role_id($role_name = '')
	{
		if (empty($role_name) || ! is_string($role_name)) return 0;
		if ( ! self::role_exists($role_name)) return 0;

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
	 * Adds the given roles to the given users - only works if current user is super user
	 *
	 * @param array $users list of user ids which should be granted the given roles
	 * @param array $roles list of role names which should be granted to the given users
	 *
	 * @return boolean false if the current user is not a super user, or true if all given
	 * users were successfully granted all given roles
	 */
	static public function add_users_to_roles(Array $users = [], Array $roles = [])
	{
		if ( ! self::is_super_user()) return false;
		return self::add_users_to_roles_system_only($users, $roles);
	}

	/**
	 * Adds the given roles to the given users - bypasses super user check, for system use only
	 *
	 * @param array $users list of user ids which should be granted the given roles
	 * @param array $roles list of role names which should be granted to the given users
	 *
	 * @return boolean false if either given array is empty, or true if all given
	 * users were successfully granted all given roles
	 */
	static public function add_users_to_roles_system_only(Array $user_ids = [], Array $role_names = [])
	{
		if (empty($user_ids) || empty($role_names)) return false;
		$success = true;

		foreach ($user_ids as $user_id)
		{
			foreach ($role_names as $role_name)
			{
				$role_id = self::get_role_id($role_name);
				if ( ! $role_id)
				{
					$success = false;
					continue;
				}

				list($id, $num) = \DB::query(
					'INSERT IGNORE
						INTO '.\DB::quote_table('perm_role_to_user').'
						SET user_id = :user_id,
						role_id = :role_id',
					\DB::INSERT)
					->param('user_id', $user_id)
					->param('role_id', $role_id)
					->execute();

				if ($num < 1)
				{
					$msg = "Unable to add user id: {$user_id} to role: {$role_name} ({$role_id})";
					\Fuel::$is_cli ? \Cli::write($msg) : \Log::warning($msg);

					$success = false;
				}
			}
		}

		return $success;
	}

	/**
	 * Returns all roles
	 *
	 * @return boolean false if the current user is not a super user, or if there are no roles
	 * @return array all roles currently in the database as objects with properties 'role_id' and 'name'
	 */
	static public function get_all_roles()
	{
		if ( ! self::is_super_user()) return false;

		$results = \DB::select()
			->from('user_role')
			->as_object()
			->execute()
			->as_array();

		if (count($results) > 0) return $results;

		return false;
	}

	/**
	 * Returns a list of all roles a given user has
	 *
	 * @param int $user_id id of the user to find roles for
	 *
	 * @return boolean false if the current user is not a super user and is trying to find
	 * somebody else's roles, or if the given user id is 0 or a negative number
	 * @return array an empty array if the given user does not exist, otherwise an array containing
	 * all roles assigned to the given user as objects with properties 'role_id' and 'name'
	 */
	static public function get_user_roles($user_id = 0)
	{
		$q = \DB::select('r.role_id', 'r.name')
			->from(['user_role', 'r'])
			->join(['perm_role_to_user', 'm'])
				->on('r.role_id', '=', 'm.role_id')
			->as_object();

		$current_id = \Model_User::find_current_id();

		// return logged in user's roles if id is 0 or less, non su users can only use this method
		if ($user_id <= 0 || $user_id == $current_id)
		{
			$roles = [];

			$results = $q->where('m.user_id', $current_id)
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
			if (self::is_super_user())
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
				\Log::warning("non-super user {$current_id} attempting role lookup for user {$user_id}");
				return false;
			}
		}
		return $roles;
	}

	/**
	 * Removes the given roles from the given users - only works if current user is super user
	 *
	 * @param array $users list of user ids which should have the given roles removed
	 * @param array $roles list of role names which should be removed from the given users
	 *
	 * @return boolean false if the current user is not a super user, or true if all given
	 * roles were successfully removd from all given roles
	 */
	static public function remove_users_from_roles(Array $users = [], Array $roles = [])
	{
		// This needs to be executable by the system
		if ( ! self::is_super_user()) return false;
		return self::remove_users_from_roles_system_only($users, $roles);
	}

	/**
	 * Removes the given roles from the given users - bypasses super user check, for system use only
	 *
	 * @param array $users list of user ids which should have the given roles removed
	 * @param array $roles list of role names which should be removed from the given users
	 *
	 * @return boolean false if either given array is empty, or true if all given
	 * roles were successfully removd from all given roles
	 */
	static public function remove_users_from_roles_system_only(Array $user_ids = [], Array $role_names = [])
	{
		if (empty($user_ids) || empty($role_names)) return false;
		$success = true;

		// @TODO: make this one query instead of a whole bunch
		foreach  ($user_ids as $user_id)
		{
			foreach ($role_names as $role_name)
			{
				\DB::delete('perm_role_to_user')
					->where('user_id', $user_id)
					->where('role_id', self::get_role_id($role_name))
					->execute();
			}
		}
		return $success;
	}


	/*
	 **********************  User to Object Rights  ***************************************
	 */

	/**
	 * Get a User's specific permissions to an object
	 *
	 * @param string $object_id id of object
	 * @param int $object_type type of object
	 * @param int $user_id id of user with perms to object
	 *
	 * @return array array of perms given user has to given object of given type
	 */
	static public function get_user_object_perms($object_id, $object_type, $user_id)
	{
		$results = \DB::select('perm')
			->from('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->where('user_id', $user_id)
			->execute();
		return self::make_perms_from_query($results);
	}

	// rights from user to object
	/**
	 * Sets user permissions for a given object
	 *
	 * @param int $object_id ID of the object to set permissions for
	 * @param int $object_type The type of object we're working with (as defined in cfg_core_Perm)
	 * @param int $user_id The user ID of the user to set permissions for
	 * @param array $perms Array in form of $perms[permission_type] = true|false (where permission_type is numeric)
	 */
	static public function set_user_object_perms($object_id, $object_type, $user_id, $perms, $exp=null)
	{
		foreach ($perms as $key => $perm)
		{
			if (is_numeric($key) && is_bool($perm))
			{
				// make sure the passed vars are number/bool pairs
				if ($perm == Perm::ENABLE)
				{
					if ($exp == -1)
					{
						$exp = null;
					}

					$user_perms = self::get_user_object_perms($object_id, $object_type, $user_id);

					if ($user_perms != null)
					{
						// update a permission
						\DB::update('perm_object_to_user')
							->value('perm', $key)
							->value('expires_at', $exp)
							->where('object_id', '=', $object_id)
							->where('object_type', '=', $object_type)
							->where('user_id', '=', $user_id)
							->execute();
					}
					else
					{
						// add a new permission
						\DB::insert('perm_object_to_user')
						->set([
							'object_id' => $object_id,
							'object_type' => $object_type,
							'user_id' => $user_id,
							'perm' => $key,
							'expires_at' => $exp,
							])
						->execute();
					}
				}
				else
				{
					// remove a permission
					self::clear_user_object_perms($object_id, $object_type, $user_id);
				}
			}
		}
	}

	/**
	 * Sets user permissions for every asset linked to a game.
	 * If user has OWN access for an asset, changes are ignored
	 *
	 * @param int $inst_id The game instance ID for this game
	 * @param int $user_id The ID for this user
	 * @param array $perms Array in form of $perms[permission_type] = true|false (where permission_type is numeric)
	 */
	static public function set_user_game_asset_perms($inst_id, $user_id, $perms, $exp = null)
	{
		// get the assets linked to this widget
		$assets_ids = Widget_Asset_Manager::get_assets_ids_by_game($inst_id);

		// change permissions
		foreach ($assets_ids as $asset_id)
		{
			// only modify perms if user doesn't have full access
			$current_perms = self::get_user_object_perms($asset_id, Perm::ASSET, $user_id);
			if (empty($current_perms[Perm::FULL]) || $current_perms[Perm::FULL] != Perm::ENABLE)
			{
				self::set_user_object_perms($asset_id, Perm::ASSET, $user_id, $perms, $exp);
			}
		}
	}

	/**
	 * Clear a user's permissions to an object
	 *
	 * @param string $object_id id of object
	 * @param int $object_type type of object
	 * @param int $user_id id of user with perms to object
	 */
	static public function clear_user_object_perms($object_id, $object_type, $user_id)
	{
		\DB::delete('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->where('user_id', $user_id)
			->execute();
	}

	/*
	 ******************************  Group to Object rights  ******************************
	 */

	/**
	 * Converts query return to a keyed array
	 *
	 * @param array $results array of records returned by query in get_user_object_perms
	 *
	 * @return array formatted array of permissions
	 */
	static private function make_perms_from_query($results)
	{
		$perms = [];
		if ($results->count() > 0)
		{
			foreach ($results as $result)
			{
				$perms[$result['perm']] = 1;
			}
		}
		return $perms;
	}

	/**
	 * Gets the role permissions based on a user's user_id, returns array with the key's as the permission values
	 *
	 * @param int $user_id id of user to check role permissions for
	 */
	static public function get_user_role_perms($user_id)
	{
		// build the subquery for all user roles a user belongs to
		$subquery = \DB::select('role_id')
			->from('perm_role_to_user')
			->where('user_id', $user_id);

		// find all permissons for the user roles a user belongs to
		$results = \DB::select('perm')
			->from('perm_role_to_perm')
			->where('role_id', 'IN', $subquery)
			->execute();

		return self::make_perms_from_query($results);
	}


	/**
	 * Removes all permissions for an object, used when deleting an object
	 *
	 * @param int User ID the get permissions for
	 * @param int Object type as defined in Perm constants
	 */
	static public function clear_all_perms_for_object($object_id, $object_type)
	{
		\DB::delete('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->execute();
	}

	/**
	 * Gets an array of object id's that a user has permissions for matching any of the requested permissions.
	 * If an object has any of the requested permissions, it will be returned.
	 * Perm_Manager->get_all_objects_for_users($user->user_id, \Materia\Perm::INSTANCE, [\Materia\Perm::SHARE]);
	 *
	 * @param int User ID the get permissions for
	 * @param int Object type as defined in Perm constants
	 * @param array Array of ints representing permissions
	 */
	static public function get_all_objects_for_user($user_id, $object_type, $perms)
	{
		if (count($perms) > 0 && is_array($perms))
		{
			$objects = [];

			// convert all instance id's to strings... because mysql behaves unexpectedly with numbers here
			// WHERE id IN (5, 6) whould match ids that ***START*** with 5 or 6
			foreach ($perms as &$value) $value = (string) $value;

			// ====================== GET THE USERS ROLE PERMISSIONS ============================
			// build a subquery that gets any roles the user has
			$subquery_role_ids = \DB::select('role_id')
				->from('perm_role_to_user')
				->where('user_id', $user_id);

			// get any perms that users roles have
			$roles_perms = \DB::select('perm')
				->from('perm_role_to_perm')
				->where('role_id', 'IN', $subquery_role_ids)
				->where('perm', 'IN', $perms)
				->execute();

			// Only super_user has role perm 30 -- get all assets/widgets
			if ($roles_perms->count() != 0)
			{
				$objects = \DB::select('id')
					->from($object_type == Perm::ASSET ? 'asset' : 'widget_instance')
					->execute()
					->as_array('id', 'id');
			}
			else
			{
				// ==================== GET USER's EXPLICIT PERMISSSION ==============================
				// get objects that the user has direct access to
				$objects = \DB::select('object_id')
					->from('perm_object_to_user')
					->where('object_type', $object_type)
					->where('user_id', $user_id)
					->where('perm', 'IN', $perms)
					->execute()
					->as_array('object_id', 'object_id');
			}
			return $objects;
		}
	}

	/**
	 * Counts the number of users with perms to a given object
	 *  to an object (used by Widget_Asset_Manager.can_asset_be_deleted)
	 * Ignores global role rights to an object
	 *
	 * @param int The ID of the object to look for
	 * @param int The type of object to look for
	 *
	 * @return int the number of users with permissions to this object
	 */
	static public function get_num_users_with_explicit_perms($object_id, $object_type)
	{
		// get one entry for each user with perms to this object

		$results = \DB::select('user_id')
			->distinct(true)
			->from('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->execute();

		return $results->count();
	}

	/**
	 * Returns all the user permissions an object has to it, for all users.
	 * If the current user is a super user, they will automatically have superuser perms to each object.
	 * Permissions are checked for expiration, if expired, they are removed and the user losing access is notified
	 * Returns an object like:
	 * [
	 *   'user_perms' => [
	 *       1  => [perm, null]
	 *   ],
	 *   'widget_user_perms' => [
	 *       1  => [perm, null],
	 *       54 => [perm, expire_timestamp]
	 *   ]
	 * ]
	 *
	 * where I'm user 1, user_perms show me my access with super user taken into account
	 * and widget_user_perms is everyone's access, ignoring super user
	 *
	 * @param string object_id id of the object
	 * @param int object_type
	 * @return array
	 */
	static public function get_all_users_explicit_perms(string $object_id, int $object_type): array
	{
		$current_user_id = \Model_User::find_current_id();

		// make sure the current user has rights to this item
		if ( ! self::user_has_any_perm_to($current_user_id, $object_id, $object_type, [Perm::FULL, Perm::VISIBLE]))
		{
			return ['user_perms' => [], 'widget_user_perms' => []];
		}

		$all_perms = self::get_all_users_with_perms_to($object_id, $object_type);

		// if the current user is a super user, append their user's perms into the results
		// super users don't get explicit perms to things set in the db, so we'll fake it here
		$cur_user_perms = self::is_super_user() ? [Perm::SUPERUSER, null] : $all_perms[$current_user_id];

		return [
			'user_perms' => [$current_user_id => $cur_user_perms],
			'widget_user_perms' => $all_perms
		];
	}

	/**
	 * Get all users that have a permission to an object
	 * Permissions are checked for expiration, if expired, they are removed and the user losing access is notified
	 *
	 * @param string $object_id
	 * @param int $object_type
	 * @return array Array of permission pairs, keyed by user id
	 */
	static public function get_all_users_with_perms_to(string $object_id, int $object_type): array
	{
		// clear out expired permissions
		self::check_and_expire_user_object_perms();

		// load all object to  user perms to this object
		$results = \DB::select()
			->from('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->execute();

		$perms = [];

		foreach ($results as $result)
		{
			$user_id  = $result['user_id'];
			$perm     = $result['perm'];
			$exp_time = $result['expires_at'];

			$perms[$user_id] = [$perm, $exp_time];
		}

		return $perms;
	}

	/**
	 * Clears out all expired object permissions, sending notification to the person who's losing perms
	 *
	 * @return void
	 */
	static protected function check_and_expire_user_object_perms()
	{
		$now = time();

		// load all expired items
		$results = \DB::select()
			->from('perm_object_to_user')
			->where('expires_at', '<=', $now)
			->execute();

		foreach ($results as $r)
		{
			\Model_Notification::send_item_notification(
				0, // 'from' user is Materia
				$r['user_id'],
				$r['object_type'],
				$r['object_id'],
				'expired',
				$r['perm']
			);
		}

		// delete all expired items
		\DB::delete('perm_object_to_user')
			->where('expires_at', '<=', $now)
			->execute();
	}

	/**
	 * Check if user has ANY of the perms
	 */
	static public function user_has_any_perm_to($user_id, $object_id, int $object_type, $search_perms)
	{
		if (empty($search_perms)) return false;

		$perms = self::get_user_object_perms($object_id, $object_type, $user_id);
		$role_perms = self::get_user_role_perms($user_id);
		$perms = self::combine_perms($perms, $role_perms);
		if ( ! is_array($search_perms)) $search_perms = [$search_perms];
		foreach ($search_perms as $perm)
		{
			if (isset($perms[$perm]) && $perms[$perm] === 1) return true;
		}

		return false;
	}

	/**
	 * Check if user has ALL of the permissions passed in search_perms
	 */
	static public function user_has_all_perms_to(int $user_id, $object_id, string $object_type, array $search_perms): bool
	{
		if (empty($search_perms)) return false;

		$perms = self::get_user_object_perms($object_id, $object_type, $user_id);
		$role_perms = self::get_user_role_perms($user_id);
		$perms = self::combine_perms($perms, $role_perms);
		$found = 0;

		if ( ! is_array($search_perms)) $search_perms = [$search_perms];
		foreach ($search_perms as $perm)
		{
			if (isset($perms[$perm]) && $perms[$perm] === 1) $found ++;
		}

		return $found == count($search_perms);
	}

	/**
	 * Send as many $perms objects as you want and get the combined object
	 */
	static public function combine_perms()
	{
		$args = func_get_args();
		if (count($args) > 0)
		{
			$master_perms = [];
			foreach ($args as $perms_obj)
			{
				foreach ($perms_obj as $key => $perm)
				{
					$master_perms[$key] = $perm;
				}
			}
		}
		return $master_perms;
	}

	/**
	 * Determine if the user associated with the given user ID lacks all non-student roles
	 */
	static public function is_student($user_id)
	{
		return ! self::does_user_have_role([\Materia\Perm_Role::AUTHOR, \Materia\Perm_Role::SU], $user_id);
	}

	static public function accessible_by_students($object_id, $object_type)
	{
		// make sure the current user has rights to this item
		if ( ! self::user_has_any_perm_to(\Model_User::find_current_id(), $object_id, $object_type, [Perm::FULL, Perm::VISIBLE])) return false;

		$result = \DB::select('p.user_id')
			->from(['perm_object_to_user', 'p'])
			->join(['perm_role_to_user', 'r'], 'left')
				->on('r.user_id', '=', 'p.user_id')
			->where('p.object_id', $object_id)
			->where('p.object_type', $object_type)
			->where('r.user_id', null)
			->execute();
		return count($result) > 0;
	}
}
