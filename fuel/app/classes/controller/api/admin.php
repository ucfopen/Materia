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

	protected function input_get()
	{
		return json_decode(Input::get('data', ''));
	}
	protected function input_post()
	{
		return json_decode(Input::post('data', ''));
	}

	public function get_widgets()
	{
		return \Materia\Widget_Manager::get_all_widgets();
	}

	public function post_widget()
	{
		$widget = $this->input_post();
		return \Materia\Widget_Manager::update_widget($widget);
	}

	public function get_users()
	{
		$search = $this->input_get()->search;
		$user_objects = \Model_User::find_by_name_search($search);
		$user_arrays = [];

		// scrub the user models
		if (count($user_objects))
		{
			foreach ($user_objects as $key => $person)
			{
				$user_arrays[$key] = $person->to_array();
			}
		}

		return $user_arrays;
	}

	//the front end already has basic user info, this will grab some more
	public function get_user()
	{
		$user_id = $this->input_get()->id;
		$instances_available = \Materia\Widget_Instance_Manager::get_all_for_user($user_id);
		$instances_played    = \Model_User::get_played_inst_info($user_id);

		return [
			'instances_available' => $instances_available,
			'instances_played'    => $instances_played,
		];
	}

	public function post_user()
	{
		$data = $this->input_post();
		$id = $data->id;
		unset($data->id);
		return \Model_User::admin_update($id, $data);
	}
}
