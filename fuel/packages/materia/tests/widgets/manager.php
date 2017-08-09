<?php
/**
 * @group App
 * @group Widget
 * @group Materia
 */

use \Materia\Widget_Manager;

class Test_Widget_Manager extends \Basetest
{

	/**
	 * @expectedException \HttpNotFoundException
	 */
	public function test_update_widget_requires_super_user()
	{
		// create an object to hold necessary properties
		$args = $this->sample_widget_update_args();
		$msg = \Materia\Widget_Manager::update_widget($args);

		return false;
	}

	public function test_update_widget_works_and_returns_expected_results()
	{
		$this->_as_super_user();

		// keep track of the original widget settings to confirm changes
		$widget = new \Materia\Widget();
		$widget->get(1);

		// get the original demo widget and duplicate it to test setting a new demo
		$inst_id = $widget->meta_data['demo'];
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($inst_id, false);
		$duplicate = $inst->duplicate();

		// create an object to hold necessary properties
		$args = new stdClass();
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->in_catalog = false;
		$args->is_editable = false;
		$args->is_scorable = false;
		$args->is_playable = false;
		$args->about = 'Test About';
		$args->excerpt = 'Test Excerpt';
		$args->demo = $duplicate->id;

		$msg = \Materia\Widget_Manager::update_widget($args);

		// load after changes
		$widget = new \Materia\Widget();
		$widget->get(1);

		// assert that the widget has changed to the expected values;
		$this->assertEquals(0, $widget->in_catalog);
		$this->assertEquals(0, $widget->is_editable);
		$this->assertEquals(0, $widget->is_scorable);
		$this->assertEquals(0, $widget->is_playable);
		$this->assertEquals('Test About', $widget->meta_data['about']);
		$this->assertEquals('Test Excerpt', $widget->meta_data['excerpt']);
		$this->assertNotEquals($inst_id, $widget->meta_data['demo']);

		// assert that update_widget returns the expected results
		foreach(['demo','in_catalog','is_editable','is_scorable','is_playable','about','excerpt'] as $key)
		{
			$this->assertTrue($msg[$key]);
		}

		// restore the original settings so future tests react properly
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->in_catalog = true;
		$args->is_editable = true;
		$args->is_scorable = true;
		$args->is_playable = true;
		$args->about = 'Test About';
		$args->excerpt = 'Test Excerpt';
		$args->demo = $inst->id;
		$msg = \Materia\Widget_Manager::update_widget($args);
	}

	public function test_update_widget_returns_not_found()
	{
		$this->_as_super_user();
		// create an object to hold necessary properties
		$widget = new \Materia\Widget();

		$args = $this->sample_widget_update_args();
		$args->id = 99999;

		$msg = \Materia\Widget_Manager::update_widget($args);
		$this->assertEquals($msg['widget'], 'Widget not found!');
	}

	public function test_update_widget_checks_clean_name_matching()
	{
		$this->_as_super_user();

		$widget = new \Materia\Widget();
		$widget->get(1);

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = 'something-that-doesnt-exist';

		$msg = \Materia\Widget_Manager::update_widget($args);
		$this->assertEquals($msg['widget'], 'Widget mismatch!');
	}

	public function test_update_widget_checks_demo_mismatch()
	{
		$this->_as_super_user();

		$widget = new \Materia\Widget();
		$widget->get(1);
		$widget2 = new \Materia\Widget();
		$widget2->get(2);

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->demo = $widget2->meta_data['demo'];

		$msg = \Materia\Widget_Manager::update_widget($args);
		$this->assertEquals($msg['demo'], 'Demo instance is for another widget!');
	}

	public function test_update_widget_cannot_find_demo()
	{
		$this->_as_super_user();
		$widget = new \Materia\Widget();
		$widget->get(1);

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->demo = -1;

		$msg = \Materia\Widget_Manager::update_widget($args);
		$this->assertEquals($msg['demo'], 'Demo instance not found!');
	}

	public function test_get_all_widgets()
	{
		$all_widgets = \Materia\Widget_Manager::get_all_widgets();
		$widget_count = (int) \DB::count_records('widget');

		$this->assertCount($widget_count, $all_widgets);
		foreach ($all_widgets as $value)
		{
			$this->assertInstanceOf('\Materia\Widget', $value);
		}

	}

	protected function sample_widget_update_args()
	{
		// create an object to hold necessary properties
		$args = new stdClass();
		$args->id = 0;
		$args->clean_name = 'clean_name';
		$args->in_catalog = 1;
		$args->is_editable = 1;
		$args->is_scorable = 1;
		$args->is_playable = 1;
		$args->about = 'About';
		$args->excerpt = 'Excerpt';
		$args->demo = -1;
		return $args;
	}
}
