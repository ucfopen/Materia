<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_Admin extends Controller_Rest
{
	use \Trait_RateLimit;
	
	protected $_supported_formats = ['json' => 'application/json'];

	public function before()
	{
		if ( ! (\Materia\Perm_Manager::is_super_user() || \Materia\Perm_Manager::is_support_user()) ) throw new \HttpNotFoundException;
		parent::before();
	}

	public function get_widgets()
	{
		return \Materia\Widget_Manager::get_widgets(null, 'admin');
	}

	public function post_widget($widget_id)
	{
		// VALIDATE INPUT
		$widget = (object) Input::json();
		return \Materia\Widget_Manager::update_widget($widget);
	}

	public function get_user_search($search)
	{
		// VALIDATE INPUT
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
	public function get_user($user_id)
	{
		// VALIDATE INPUT
		$instances_available = \Materia\Widget_Instance_Manager::get_all_for_user($user_id);
		$instances_played    = \Service_User::get_played_inst_info($user_id);

		return [
			'instances_available' => $instances_available,
			'instances_played'    => $instances_played,
		];
	}

	public function post_user($user_id)
	{
		// VALIDATE INPUT
		$user = (object) Input::json();
		unset($user->id);
		return \Service_User::update_user($user_id, $user);
	}

	public function get_widget_search(string $input)
	{
		$input = trim($input);	
		//no need to search if for some reason an empty string is passed
		if ($input == '') return [];
		return \Materia\Widget_Instance_Manager::get_search($input);
	}

	public function get_extra_attempts(string $inst_id)
	{
		$inst = \Materia\Widget_Instance_Manager::get($inst_id);
		return $inst->get_all_extra_attempts();
	}

	public function post_extra_attempts(string $inst_id)
	{
		// Get POSTed json input
		$extra_attempts = Input::json();
		
		$inst = \Materia\Widget_Instance_Manager::get($inst_id);
		
		// iterate thru each extra attempt and set it in the db
		foreach ($extra_attempts as $value)
		{
			$inst->set_extra_attempts(
				$value['user_id'], 
				$value['extra_attempts'], 
				$value['context_id'],
				$value['id'] > 0 ? $value['id'] : null);
		}

		return true;
	}
}
