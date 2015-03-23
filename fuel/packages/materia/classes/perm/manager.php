<?php
/**
 * Materia
 * It's a thing.
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  perms
 * @author      ADD NAME HERE
 */

namespace Materia;

class Perm_Manager
{
	/*
	 **********************  User to Object Rights  ***************************************
	 */

	/**
	* Get a User's specific permissions to an object
	*
	* @param unknown NEEDS DOCUMENTATION
	* @param unknown NEEDS DOCUMENTATION
	* @param unknown NEEDS DOCUMENTATION
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

	// rigts from user user to object
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
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
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
	 * @param unknown NEEDS DOCUMENTATION
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

	/*
	 **********************************  A users group rights    ******************************
	 */

	/**
	 * Gets all the perms for a user group
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_user_group_perms($role_id)
	{
		$results = \DB::select('perm')
			->from('perm_role_to_perm')
			->where('role_id', $role_id)
			->execute();

		return self::make_perms_from_query($results);
	}

	/**
	 * Explicitly enables/disables user group permissions
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function set_user_group_perms($role_id, $perms)
	{
		if (count($perms) > 0 && is_array($perms))
		{
			foreach ($perms as $key => $perm)
			{
				// make sure the passed vars are number/bool pairs
				if (is_numeric($key) && is_bool($perm))
				{
					if ($perm == Perm::ENABLE)
					{
						// Add a permission
						\DB::query('INSERT IGNORE INTO '.\DB::quote_table('perm_role_to_perm').' SET role_id = :role_id, `perm` = :perm',
							\DB::INSERT)
							->param('role_id', $role_id)
							->param('perm', $key)
							->execute();
					}
					else
					{
						// remove a permission
						\DB::delete('perm_role_to_perm')
							->where('role_id', $role_id)
							->where('perm', $key)
							->execute();
					}
				}
			}
		}
	}

	/**
	 * Gets the group rights based on a user's user_id, returns array with the key's as the permission values
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_user_group_access($user_id)
	{
		// build the subquery for all user groups a user belongs to
		$subquery = \DB::select('role_id')
			->from('perm_role_to_user')
			->where('user_id', $user_id);

		// find all permissons for the user groups a user belongs to
		$results = \DB::select('perm')
			->from('perm_role_to_perm')
			->where('role_id', 'IN', $subquery)
			->execute();

		return self::make_perms_from_query($results);
	}


	/**
	 * Removes all permissions for an object, used when deleting an object
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
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
					->as_array();
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
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @return array
	 */
	static public function get_all_users_explicit_perms($object_id, $object_type)
	{
		$current_user_id = \Model_User::find_current_id();
		// make sure the current user has rights to this item
		if ( ! self::check_user_perm_to_object($current_user_id, $object_id, $object_type, [Perm::FULL, Perm::VISIBLE]))
		{
			return [];
		}

		$perms = [
			'user_perms' => [],
			'widget_user_perms' => []
		];

		$cur_time = time();

		$results = \DB::select()
			->from('perm_object_to_user')
			->where('object_id', $object_id)
			->where('object_type', $object_type)
			->execute();

		if (\RocketDuck\Perm_Manager::is_super_user())
		{
			$perms['user_perms'][$current_user_id] = [Perm::SUPERUSER, null];
		}

		foreach ($results as $result)
		{
			$user_id  = $result['user_id'];
			$perm     = $result['perm'];
			$exp_time = $result['expires_at'];

			//if this permission hasn't exceeded expiration date or doesn't have one at all
			if ($exp_time == null || $cur_time < $exp_time)
			{
				if ($user_id == $current_user_id && empty($perms['user_perms']))
				{
					$perms['user_perms'][$user_id] = [$perm, $exp_time];
				}
				$perms['widget_user_perms'][$user_id] = [$perm, $exp_time];
			}
			else //this permission has expired, notify the user and remove the permission
			{
				\Model_Notification::send_item_notification(
					\Model_User::find_current_id(),
					$user_id,
					$object_type,
					$object_id,
					'expired',
					$perm);

				self::clear_user_object_perms($object_id, $object_type, $user_id);
			}
		}
		return $perms;
	}

	/**
	 * Removes any permissions set for a specific object
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @return bool, true if removed object permissions, false if current user does not have owner premissions
	 */
	static public function remove_all_permissions($object_id, $object_type)
	{
		// make sure the current user has rights to this item
		// NOTE: might want to fix stuff to re-enable this
		// there was a bug upon copying a game when the permissions to the copy wer being re-set
		$current_user_id = (int)\Model_User::find_current_id();

		if ( ! self::get_user_object_perms($object_id, $object_type, $current_user_id)) return false;

		\Event::trigger('delete_widget_event', ['user_id' => $current_user_id, 'object_id' => $object_id, 'object_type' => $object_type]);

		self::clear_all_perms_for_object($object_id, $object_type);

		return true;
	}

	/**
	 * Checks for a specific permission based on that user's combined access permissions
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function check_user_perm_to_object($user_id, $object_id, $object_type, $search_perms)
	{
		if (empty($search_perms)) return false;

		$perms = self::get_user_object_perms($object_id, $object_type, $user_id);
		$group_perms = self::get_user_group_access($user_id);
		$perms = self::combine_perms($perms, $group_perms);
		if ( ! is_array($search_perms)) $search_perms = [$search_perms];
		foreach ($search_perms as $perm)
		{
			if (isset($perms[$perm]) && $perms[$perm] === 1)
			{
				return true;
			}
		}

		return false;
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

	static public function can_play($user, $widget_inst)
	{
		if ($widget_inst->guest_access == 1 || Materia\Api::session_valid() == true)
		{
			return true;
		}
		return false;
	}

}
