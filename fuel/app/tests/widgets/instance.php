<?php
/**
 * @group App
 * @group Widget
 * @group Materia
 */

use \Materia\Widget_Instance;
use \Materia\Widget_Manager;

class Test_Widget_Instance extends \Basetest
{

	public function test_db_store()
	{
		$widget = $this->make_disposable_widget();

		$props = [
			'name'            => 'THIS IS A Name!',
			'height'          => 55,
			'width'           => 100,
			'is_playable'     => 0,
			'is_editable'     => true,
			'in_catalog'      => false,
			'api_version'     => '2',
			'user_id'         => 1,
			'is_draft'        => false,
			'embedded_only'   => true,
			'embedded_only'   => 1,
			'guest_access'    => 0,
			'is_student_made' => 1,
			'widget'          => $widget,
			'published_by'    => 1
		];


		$wi = new Widget_Instance($props);
		$x = $wi->db_store();
		self::assertTrue($x);

		$wi->guest_access = 1;
		$wi->embedded_only = false;
		$wi->is_student_made = true;
		$wi->is_draft = true;
		$x = $wi->db_store();

		self::assertTrue($x);
	}

	public function test_duplicate_creates_new_id()
	{
		// keep track of the original widget settings to confirm changes

		$widget = $this->make_disposable_widget();
		$inst_id = $widget->meta_data['demo'];

		// get the original demo widget and duplicate it to test setting a new demo
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($widget->meta_data['demo'], false);
		$user_id = 1;
		$duplicate = $inst->duplicate($user_id);

		// make sure the new instance is different from the current demo
		$this->assertNotEquals($inst_id, $duplicate->id);
	}

	public function test_duplicate_existing_perms_copy()
	{
		// have to be logged in as author for perms checks to pass
		$me = $this->_as_author();

		$widget = $this->make_disposable_widget();

		$inst = new \Materia\Widget_Instance();
		$inst->db_get($widget->meta_data['demo'], false);

		// set multiple owners to the original widget
		$owners = [$me->id, 2, 3, 4, 5];
		$inst->set_owners($owners);

		$original_perms = \Materia\Perm_Manager::get_all_users_explicit_perms($inst->id, \Materia\Perm::INSTANCE);

		// make a duplicate, with copy_existing_perms to true
		$duplicate = $inst->duplicate(2, 'New Widget Copy', true);

		$duplicate_perms = \Materia\Perm_Manager::get_all_users_explicit_perms($duplicate->id, \Materia\Perm::INSTANCE);

		// make sure the original perms look like we expect before
		// comparing them below
		$this->assertEquals($original_perms,[
			'user_perms' => [$me->id => [30, null]],
			'widget_user_perms' => [$me->id => [30, null], 2 => [30, null], 3 => [30, null], 4 => [30, null], 5 => [30, null]]
		]);

		// ensure duplicate perms match original perms
		$this->assertEquals($original_perms['widget_user_perms'], $duplicate_perms['widget_user_perms']);
	}


	public function test_db_remove_is_successful()
	{
		// have to be logged in as author for perms checks to pass
		$me = $this->_as_author();

		$widget = $this->make_disposable_widget();
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($widget->meta_data['demo'], false);
		$inst->set_owners([$me->id]);

		// lets register an event listener
		// and a variable to capture the args
		$event_fired_args = null;
		\Event::register('widget_instance_delete', function($event) use (&$event_fired_args)
		{
			$event_fired_args = $event;
		});

		$result = $inst->db_remove();

		$this->assertTrue($result);
		$this->assertEquals($event_fired_args, ['inst_id' => $inst->id, 'deleted_by_id' => $me->id]);

		// make sure the instance doesn't load now
		$reload_inst = new \Materia\Widget_Instance();
		$this->assertFalse($reload_inst->db_get($inst->id));
	}

}
