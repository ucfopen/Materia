<?php
/**
 * @group App
 * @group Api
 * @group Materia
 * @group Admin
 */
class Test_Controller_Api_Admin extends \Basetest
{
	public function setUp()
	{
		parent::setUp();
		$this->_asSu();
	}

	public function test_get_widgets()
	{
		$widgets = \Materia\Widget_Manager::get_all_widgets();
		$widget_count = \DB::count_records('widget');
		$this->assertEquals($widget_count, count($widgets));
	}

	public function test_post_widget_all_success()
	{
		// keep track of the original widget settings to confirm changes
		$original = new \Materia\Widget();
		$original->get(1);

		// get the original demo widget and duplicate it to test setting a new demo
		$demo = new \Materia\Widget_Instance();
		$demo->db_get($original->meta_data['demo'], false);
		$duplicate = $demo->duplicate();

		// make sure the new instance is different from the current demo
		$this->assertNotEquals($original->meta_data['demo'], $duplicate->id);

		// create an object to hold necessary properties
		$update = new stdClass();
		$update->id = $original->id;
		$update->clean_name = $original->clean_name;
		$update->in_catalog = false;
		$update->is_editable = false;
		$update->is_scorable = false;
		$update->is_playable = false;
		$update->about = 'Test About';
		$update->excerpt = 'Test Excerpt';
		$update->demo = $duplicate->id;

		$msg = \Materia\Widget_Manager::update_widget($update);
		foreach(['demo','in_catalog','is_editable','is_scorable','is_playable','about','excerpt'] as $key)
		{
			$this->assertTrue($msg[$key]);
		}

		$changed = new \Materia\Widget();
		$changed->get(1);

		// compare fields to make sure the changes went into effect
		foreach(['in_catalog','is_editable','is_scorable','is_playable'] as $key)
		{
			$this->assertNotEquals($original->$key, $changed->$key);
		}
		foreach(['demo', 'about', 'excerpt'] as $key)
		{
			$this->assertNotEquals($original->meta_data[$key], $changed->meta_data[$key]);
		}

		// restore the original settings so future tests react properly
		$update->id = $original->id;
		$update->clean_name = $original->clean_name;
		$update->in_catalog = true;
		$update->is_editable = true;
		$update->is_scorable = true;
		$update->is_playable = true;
		$update->about = 'Test About';
		$update->excerpt = 'Test Excerpt';
		$update->demo = $demo->id;
		$msg = \Materia\Widget_Manager::update_widget($update);
		foreach(['demo','in_catalog','is_editable','is_scorable','is_playable','about','excerpt'] as $key)
		{
			$this->assertTrue($msg[$key]);
		}
	}

	public function test_post_widget_failures()
	{
		$first = new \Materia\Widget();
		$first->get(1);

		$other = new \Materia\Widget();
		$other->get(2);

		// create an object to hold necessary properties
		$update = new stdClass();
		$update->id = 3;
		$update->clean_name = $other->clean_name; //use the wrong clean name on purpose
		$update->in_catalog = 1;
		$update->is_editable = 1;
		$update->is_scorable = 1;
		$update->is_playable = 1;
		$update->about = 'About';
		$update->excerpt = 'Excerpt';
		$update->demo = $other->meta_data['demo'];

		//first test - widget not found
		$msg = \Materia\Widget_Manager::update_widget($update);
		$this->assertEquals($msg['widget'], 'Widget not found!');

		$update->id = $first->id;

		//second test - widget clean name mismatch
		$msg = \Materia\Widget_Manager::update_widget($update);
		$this->assertEquals($msg['widget'], 'Widget mismatch!');

		$update->id = $first->id;
		$update->clean_name = $first->clean_name;

		//third test - demo is for a different widget
		$msg = \Materia\Widget_Manager::update_widget($update);
		$this->assertEquals($msg['demo'], 'Demo instance is for another widget!');

		$update->id = $first->id;
		$update->clean_name = $first->clean_name;

		//fourth test - demo not found
		$update->demo = -1;
		$msg = \Materia\Widget_Manager::update_widget($update);
		$this->assertEquals($msg['demo'], 'Demo instance not found!');
	}

	private function parseUsers($user_objects)
	{
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

	public function test_get_users()
	{
		//create some users which we can target with a search term
		// \Fuel\Tasks\Admin::quick_test_users();
		for($i = 1; $i <= 10; $i++)
		{
			\Fuel\Tasks\Admin::new_user('admintest'.$i, 'admi', 'N', 'Test', $i.'admin@tar.get', $i);
		}
		\Fuel\Tasks\Admin::new_user('target', 'Target', 'T', 'Target', 'target@tar.get', 'target');

		$search = 'admi';
		$user_objects = \Model_User::find_by_name_search($search);
		$user_arrays = $this->parseUsers($user_objects);

		// we should have a predictable number of results
		$this->assertEquals(count($user_arrays), 10);
		// make sure the search string is present in any of the relevant parts of this user's identifying info
		foreach($user_arrays as $u)
		{
			$this->assertTrue(
				strpos(strtolower($u['username']), $search) !== false
				|| strpos(strtolower($u['first']), $search) !== false
				|| strpos(strtolower($u['last']), $search) !== false
				|| strpos(strtolower($u['email']), $search) !== false
			);
		}

		//now try a more specific search
		$search = 'target';
		$user_objects = \Model_User::find_by_name_search($search);
		$user_arrays = $this->parseUsers($user_objects);

		$this->assertEquals(count($user_arrays), 1);
		$u = $user_arrays[0];
		$this->assertTrue(
			strpos(strtolower($u['username']), $search) !== false
			|| strpos(strtolower($u['first']), $search) !== false
			|| strpos(strtolower($u['last']), $search) !== false
			|| strpos(strtolower($u['email']), $search) !== false
		);
	}

	public function test_get_user()
	{
		// a widget instance needs to be made and/or played by a user in order to test this at all
		// start with an author
		$author = $this->_asAuthor3();

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

	public function test_post_user()
	{
		// test the most recent user
		$id = \Model_User::count() - 1;
		$original = \Model_User::find($id);
		$original = $original->to_array();

		$data = new stdClass();
		$data->email = 'updated@tar.get';
		$data->is_student = true;
		$data->notify = false;
		$data->useGravatar = false;

		\Model_User::admin_update($id, $data);

		$changed = \Model_User::find($id);
		$changed = $changed->to_array();
		$this->assertNotEquals($original['email'], $changed['email']);
		$this->assertNotEquals($original['profile_fields']['notify'], $changed['profile_fields']['notify']);
		$this->assertNotEquals($original['profile_fields']['useGravatar'], $changed['profile_fields']['useGravatar']);
		$this->assertTrue($changed['is_student']);
	}
}