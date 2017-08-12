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
}
