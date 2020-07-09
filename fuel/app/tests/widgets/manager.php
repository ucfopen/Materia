<?php
/**
 * @group App
 * @group Widget
 * @group Materia
 */

use \Materia\Widget_Manager;

class Test_Widget_Manager extends \Basetest
{

	public function test_update_widget_requires_super_user()
	{
		$this->expectException(\HttpNotFoundException::class);

		// create an object to hold necessary properties
		$args = $this->sample_widget_update_args();
		$msg = \Materia\Widget_Manager::update_widget($args);
	}

	public function test_update_widget_works_and_returns_expected_results()
	{
		$mock_widget = $this->make_disposable_widget();
		$this->_as_super_user();

		// get the original demo widget and duplicate it to test setting a new demo
		$inst_id = $mock_widget->meta_data['demo'];
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($inst_id, false);
		$user_id = 1;
		$duplicate = $inst->duplicate($user_id);

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
		$widget = \Materia\Widget::forge($mock_widget->id);

		// assert that the widget has changed to the expected values;
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

		$args = $this->sample_widget_update_args(99999);

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['widget'], 'Widget not found!');
	}

	public function test_update_widget_checks_clean_name_matching()
	{
		$this->_as_super_user();

		$widget = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args($widget->id, 'clean_name_that_doesnt_exist');

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['widget'], 'Widget mismatch!');
	}

	public function test_update_widget_checks_demo_mismatch()
	{
		$this->_as_super_user();

		$widget = $this->make_disposable_widget();
		$widget2 = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args($widget->id, $widget->clean_name);
		$args->demo = $widget2->meta_data['demo'];

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['demo'], 'Demo instance is for another widget!');
	}

	public function test_update_widget_cannot_find_demo()
	{
		$this->_as_super_user();
		$widget = $this->make_disposable_widget();

		$args = $this->sample_widget_update_args($widget->id, $widget->clean_name);
		$args->demo = -1;

		$msg = \Materia\Widget_Manager::update_widget($args);
		self::assertEquals($msg['demo'], 'Demo instance not found!');
	}

	public function test_get_all_widgets_all()
	{
		$not_in_catalog = $this->make_disposable_widget();
		$not_playable = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();

		// this shouldn't show up
		$this->_as_super_user();
		$args = $this->sample_widget_update_args($not_in_catalog->id, $not_in_catalog->clean_name);
		$args->in_catalog = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		// this shouldn't show up
		$args = $this->sample_widget_update_args($not_playable->id, $not_playable->clean_name);
		$args->is_playable = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		$res = \Materia\Widget_Manager::get_widgets(null, 'all');
		self::assertCount(3, $res);

		self::assertEquals($not_in_catalog->id, $res[0]->id);
		self::assertEquals($visible[0]->id, $res[1]->id);
		self::assertEquals($visible[1]->id, $res[2]->id);
	}

	public function test_get_all_widgets_featured()
	{
		$not_in_catalog = $this->make_disposable_widget();
		$not_playable = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();

		// this shouldn't show up
		$this->_as_super_user();
		$args = $this->sample_widget_update_args($not_in_catalog->id, $not_in_catalog->clean_name);
		$args->in_catalog = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		// this shouldn't show up
		$args = $this->sample_widget_update_args($not_playable->id, $not_playable->clean_name);
		$args->is_playable = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		$res = \Materia\Widget_Manager::get_widgets(null, 'featured');
		self::assertCount(2, $res);

		self::assertEquals($visible[0]->id, $res[0]->id);
		self::assertEquals($visible[1]->id, $res[1]->id);
	}


	public function test_get_all_widgets_by_id()
	{
		$not_in_catalog = $this->make_disposable_widget();
		$not_playable = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();

		// this shouldn't show up
		$this->_as_super_user();
		$args = $this->sample_widget_update_args($not_in_catalog->id, $not_in_catalog->clean_name);
		$args->in_catalog = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		// this shouldn't show up
		$args = $this->sample_widget_update_args($not_playable->id, $not_playable->clean_name);
		$args->is_playable = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		$res = \Materia\Widget_Manager::get_widgets(null, 'featured');
		self::assertCount(2, $res);

		self::assertEquals($visible[0]->id, $res[0]->id);
		self::assertEquals($visible[1]->id, $res[1]->id);
	}

	public function test_get_all_widgets_admin()
	{
		$not_in_catalog = $this->make_disposable_widget();
		$not_playable = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();
		$visible[] = $this->make_disposable_widget();

		// this shouldn't show up
		$this->_as_super_user();
		$args = $this->sample_widget_update_args($not_in_catalog->id, $not_in_catalog->clean_name);
		$args->in_catalog = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		// this shouldn't show up
		$args = $this->sample_widget_update_args($not_playable->id, $not_playable->clean_name);
		$args->is_playable = false;
		$msg = \Materia\Widget_Manager::update_widget($args);

		$res = \Materia\Widget_Manager::get_widgets(null, 'admin');
		self::assertCount(4, $res);

		self::assertEquals($not_in_catalog->id, $res[0]->id);
		self::assertEquals($not_playable->id, $res[1]->id);
		self::assertEquals($visible[0]->id, $res[2]->id);
		self::assertEquals($visible[1]->id, $res[3]->id);
	}

	protected function sample_widget_update_args($id=0, $clean_name='clean_name')
	{
		// create an object to hold necessary properties
		$args = new stdClass();
		$args->id = $id;
		$args->clean_name = $clean_name;
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
