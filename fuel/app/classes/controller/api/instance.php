<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_Instance extends Controller_Rest
{

	use Trait_Apiutils;

	protected $_supported_formats = ['json' => 'application/json'];
	
	/**
	 * Requests all qsets for a given widget instance ID.
	 * Current user must have author/collab access to the widget.
	 * Requires ?inst_id=<instance id value> to be set
	 * @return array the qset save history as an array
	 */
	public function get_history()
	{
		if ( ! $inst_id = Input::get('inst_id')) return $this->response('Requires an inst_id parameter!', 401);
		if ( ! \Materia\Util_Validator::is_valid_hash($inst_id) ) return $this->response(\Materia\Msg::invalid_input($inst_id), 401);
		if ( ! ($inst = \Materia\Widget_Instance_Manager::get($inst_id))) return $this->response('Instance not found', 404);
		if ( ! \Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, \Materia\Perm::INSTANCE, [\Materia\Perm::FULL])) return $this->response(\Materia\Msg::no_login(), 401);
		
		$history = $inst->get_qset_history($inst_id);

		return $this->response($history, 200);
	}

	public function post_request_access()
	{
		$user_id = \Model_User::find_current_id();
		$inst_id = Input::post('inst_id', null);
		$owner_id = Input::post('owner_id', null);
		\Model_Notification::send_item_notification($user_id, $owner_id, \Materia\Perm::INSTANCE, $inst_id, 'access_request', \Materia\Perm::FULL);
	}
}
