<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_Admin extends Controller_Rest
{
	use Lib_Apiutils;

	protected $_supported_formats = ['json' => 'application/json'];

	public function before()
	{
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) throw new HttpNotFoundException;
		parent::before();
	}

	public function post_call($format, $method)
	{
		$input = json_decode(Input::post('data', []));
		$this->execute($method, $input);
	}

	public function get_call($format, $method)
	{
		$input = array_slice($this->request->route->method_params, 3);
		$this->execute($method, $input);
	}

	protected function execute($method, $args)
	{
		if ( ! method_exists($this, $method)) throw new HttpNotFoundException;

		$result = call_user_func_array([$this, $method], $args);

		$this->no_cache();
		$this->response($result, 200);
	}

	private function widgets_get()
	{
		return \Materia\Widget_Manager::get_all_widgets();
	}

	private function widget_update($widget)
	{
		return \Materia\Widget_Manager::update_widget($widget);
	}

	private function users_search($search)
	{
		$user_objects = \Model_User::find_by_name_search($search);
		$user_arrays = [];

		// scrub the user models with to_array
		if (count($user_objects))
		{
			foreach ($user_objects as $key => $person)
			{
				$user_arrays[$key] = $person->to_array();
			}
		}

		return $user_arrays;
	}

	private function user_lookup($user_id)
	{
		//the front end already has basic user info, so get some more
		//all of the instances this user has access to
		$instances_access = \Materia\Widget_Instance_Manager::get_all_for_user($user_id);
		$instances_played = \Model_User::get_played_inst_scores($user_id);

		return [
			'instances_access' => $instances_access,
			'instances_played' => $instances_played,
		];
	}

	private function user_save($data)
	{
		$id = $data->id;
		unset($data->id);
		return \Model_User::admin_update($id, $data);
	}
}
