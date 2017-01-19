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

		// $result = $this->execute($version, $method, $input);
		// $this->no_cache();
		// $this->response($result, 200);

		$this->_execute($method, $input);
	}

	public function get_call($format, $method)
	{
		$input = array_slice($this->request->route->method_params, 3);
		$this->_execute($method, $input);
	}

	private function _execute($method, $args)
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
}
