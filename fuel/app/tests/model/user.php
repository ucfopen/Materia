<?php
/**
 * @group App
 * @group Model
 * @group User
 * @group Materia
 */

use \Materia\Widget_Installer;

class Test_Model_User extends \Basetest
{

	public function test_find_by_name_search_doesnt_find_super_users()
	{
		// su should't be found
		$su = $this->make_random_super_user();
		$x = Model_User::find_by_name_search($su->email)->as_array();
		self::assertEmpty($x);

		// add a student with the same name, should only find the one student
		$this->make_random_student();
		$x = Model_User::find_by_name_search('drop')->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertNotEquals($su->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_email()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_first_name()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->first)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_last_name()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->last)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_username()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->username)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_authors()
	{
		$user = $this->make_random_author();
		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_multiple_matches()
	{
		$user1 = $this->make_random_author();
		$user2 = $this->make_random_student();

		$x = Model_User::find_by_name_search('drop')->as_array();
		self::assertCount(2, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertInstanceOf('Model_User', $x[1]);

		$ids = [$x[0]->id, $x[1]->id];

		self::assertContains($user1->id, $ids);
		self::assertContains($user2->id, $ids);
	}

	public function test_admin_update_changes_user()
	{
		$this->_as_super_user();
		$user = $this->make_random_student();

		// build some options to update him
		$data = new stdClass();
		$data->email = 'updated@tar.get';
		$data->is_student = true;
		$data->notify = false;
		$data->useGravatar = false;

		// update him
		\Model_User::admin_update($user->id, $data);

		// make sure the variables were set
		$this->assertEquals($data->email, $user->email);
		$this->assertFalse($user->profile_fields['useGravatar']);
		$this->assertFalse($user->profile_fields['notify']);
		$this->assertTrue(\Materia\Perm_Manager::is_student($user->id));


		// make sure the model was saved
		// we have to run the observers manually because I think
		// fuelphp doesn't handle changed state properly
		// with a serialize observer
		$user->observe('before_save');
		$this->assertFalse($user->is_changed());
		$user->observe('after_save');
	}

	public function test_get_played_inst_info()
	{
		// a widget instance needs to be made and/or played by a user in order to test this at all
		// start with an author
		$author = $this->_as_author_3();

		// create a new published widget instance
		$qset = $this->create_new_qset('Question', 'Answer');
		$instance_output = \Materia\Api_V1::widget_instance_new(1, 'Title', $qset, false);
		$qset = $instance_output->qset;

		// create a play for the new instance
		$logs = [
			[
				'type' => 1004,
				'item_id' => $qset->data['items'][0]['items'][0]['id'],
				'text' => 'Answer',
				'game_time' => 1
			],
			[
				'type' => 2,
				'item_id' => 0,
				'text' => '',
				'value' => '',
				'game_time' => 1
			]
		];

		$play_output = $this->spoof_widget_play($instance_output, 'test_context');
		$score = \Materia\Api_V1::play_logs_save($play_output, $logs);

		// log in as a super user to pass the safeguards
		$this->_as_super_user();

		$instances_available = \Materia\Widget_Instance_Manager::get_all_for_user($author->id);
		$instances_played    = \Model_User::get_played_inst_info($author->id);

		$this->assertEquals(count($instances_available), 1);
		$this->assertEquals($instance_output->id, $instances_available[0]->id);

		$this->assertEquals(count($instances_played), 1);
		$play = $instances_played[0];
		$this->assertEquals($play_output, $play->play_id);
		$this->assertEquals($instance_output->id, $play->id);
		$this->assertEquals($instance_output->name, $play->name);
		$this->assertEquals($instance_output->widget, $play->widget);
		$this->assertEquals(true, $play->is_complete);
		$this->assertEquals(100, $play->percent);
	}
}
