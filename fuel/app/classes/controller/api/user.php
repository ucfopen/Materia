<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_User extends Controller_Rest
{

	use Trait_Apiutils;

	protected $_supported_formats = ['json' => 'application/json'];

	public function get_activity()
	{
		$this->no_cache();
		$result = \Materia\Api::play_activity_get(Input::get('start', 0), Input::get('range', 6));
		$this->response($result, 200);
	}

	public function post_settings()
	{
		if (\Service_User::verify_session() !== true) return $this->response('Not logged in', 401);

		$success   = false;
		$set_meta  = [
			'useGravatar' => Input::json('useGravatar', null),
			'notify'      => Input::json('notify', null),
			'darkMode'	  => Input::json('darkMode', null)
		];

		$success = Materia\Api::user_update_meta($set_meta);
		$me = \Model_User::find_current();

		$reply = [
			'success' => $success,
			'avatar'  => \Materia\Utils::get_avatar(),
			'meta'    => $me->profile_fields,
		];

		return $this->response($reply);
	}

	public function post_roles()
	{
		if (\Service_User::verify_session() !== true) return $this->response('Not logged in', 401);
		// this endpoint is only available to superusers!
		if ( ! \Materia\Perm_Manager::is_super_user()) return $this->response('Not authorized', 403);

		$success = false;
		$user_id = Input::json('id', null);
		$roles = [
			'basic_author' => Input::json('author', false),
			'support_user' => Input::json('support_user', false)
		];

		if ( ! $user_id) return $this->response('User ID not provided', 401);

		$current_roles = \Materia\Perm_Manager::get_user_roles($user_id);
		$current_roles_condensed = array_map( fn($r) => $r->name, $current_roles);

		$roles_to_add = [];
		$roles_to_revoke = [];

		foreach ($roles as $name => $val)
		{
			if ( ! in_array($name, $current_roles_condensed) && $val == true) array_push($roles_to_add, $name);
			else if (in_array($name, $current_roles_condensed) && $val == false) array_push($roles_to_revoke, $name);
		}

		$message = '';

		if (count($roles_to_add) > 0)
		{
			$success = \Materia\Perm_Manager::add_users_to_roles([$user_id], $roles_to_add);
			if ($success != true) return $this->response(['success' => false, 'status' => 'Failed to add roles']);
			$message .= count($roles_to_add).' role(s) added.';
		}

		if (count($roles_to_revoke) > 0)
		{
			$success = \Materia\Perm_Manager::remove_users_from_roles([$user_id], $roles_to_revoke);
			if ($success != true) return $this->response(['success' => false, 'status' => 'Failed to revoke roles']);
			$message .= count($roles_to_revoke).' role(s) revoked.';
		}

		if (strlen($message) == 0)
		{
			$message .= 'No roles were changed.';
		}

		return $this->response([
			'success' => true,
			'status'  => $message
		]);
	}
}
