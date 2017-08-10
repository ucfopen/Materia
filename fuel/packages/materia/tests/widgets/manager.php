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
		$mock_widget = $this->make_disposable_widget();
		$this->_as_super_user();

		// get the original demo widget and duplicate it to test setting a new demo
		$inst_id = $mock_widget->meta_data['demo'];
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($inst_id, false);
		$duplicate = $inst->duplicate();

		// create an object to hold necessary properties
		$args = new stdClass();
		$args->id = $mock_widget->id;
		$args->clean_name = $mock_widget->clean_name;
		$args->in_catalog = false;
		$args->is_editable = false;
		$args->is_scorable = false;
		$args->is_playable = false;
		$args->about = 'Test About';
		$args->excerpt = 'Test Excerpt';
		$args->demo = $duplicate->id;

		$msg = \Materia\Widget_Manager::update_widget($args);

		// assert that update_widget returns the expected results
		foreach(['demo','in_catalog','is_editable','is_scorable','is_playable','about','excerpt'] as $key)
		{
			self::assertTrue($msg[$key]);
		}

		// load after changes
		$widget = new \Materia\Widget();
		$widgetFound = $widget->get($mock_widget->id);

		// assert that the widget has changed to the expected values;
		self::assertTrue($widgetFound);
		self::assertEquals(0, $widget->in_catalog);
		self::assertEquals(0, $widget->is_editable);
		self::assertEquals(0, $widget->is_scorable);
		self::assertEquals(0, $widget->is_playable);
		self::assertEquals('Test About', $widget->meta_data['about']);
		self::assertEquals('Test Excerpt', $widget->meta_data['excerpt']);
		self::assertNotEquals($inst_id, $widget->meta_data['demo']);
	}

	public function test_update_widget_returns_not_found()
	{
		$this->_as_super_user();
		// create an object to hold necessary properties
		$widget = new \Materia\Widget();

		$args = $this->sample_widget_update_args();
		$args->id = 99999;

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['widget'], 'Widget not found!');
	}

	public function test_update_widget_checks_clean_name_matching()
	{
		$this->_as_super_user();

		$widget = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = 'something-that-doesnt-exist';

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['widget'], 'Widget mismatch!');
	}

	public function test_update_widget_checks_demo_mismatch()
	{
		$this->_as_super_user();

		$widget = $this->make_disposable_widget();
		$widget2 = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->demo = $widget2->meta_data['demo'];

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['demo'], 'Demo instance is for another widget!');
	}

	public function test_update_widget_cannot_find_demo()
	{
		$this->_as_super_user();
		$widget = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args();
		$args->id = $widget->id;
		$args->clean_name = $widget->clean_name;
		$args->demo = -1;

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['demo'], 'Demo instance not found!');
	}

	public function test_get_all_widgets_all()
	{
		$this->markTestIncomplete();
	}

	public function test_get_all_widgets_featured()
	{
		$this->markTestIncomplete();
	}


	public function test_get_all_widgets_by_id()
	{
		$this->markTestIncomplete();
	}

	public function test_get_all_widgets_admin()
	{
		$all_widgets = \Materia\Widget_Manager::get_widgets(null, 'admin');
		$widget_count = (int) \DB::count_records('widget');

		self::assertCount($widget_count, $all_widgets);
		foreach ($all_widgets as $value)
		{
			self::assertInstanceOf('\Materia\Widget', $value);
		}

		// Need a simple way to setup and teardown widgets so we can test widgets with in_catalog and is_playable
		$this->markTestIncomplete();
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
