<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets_Test extends Controller_Widgets
{
	public function before()
	{
		parent::before();
		if (\Fuel::$env != \Fuel::DEVELOPMENT) throw new HttpNotFoundException;
	}
	public function after($response)
	{
		return parent::after($response);
	}

	public function action_external($widget_id)
	{
		$this->theme->set_template('test/layouts/test_external_system');

		$this->theme->get_template()
			->set('widget_id', $widget_id);
	}
}
