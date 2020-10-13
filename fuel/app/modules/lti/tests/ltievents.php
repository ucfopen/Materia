<?php
/**
 * @group App
 * @group Module
 * @group Lti
  * @group LtiEvents
 */
class Test_LtiEvents extends \Test_Basetest
{

	public function test_on_before_play_start_event_not_lti_does_nothing()
	{
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$event_args = ['inst_id' => $inst_id, 'is_embedded' => true];

		// Not an LTI launch, so nothing should happen (and no events thrown)
		$result = \Lti\LtiEvents::on_before_play_start_event($event_args);
		$this->assertCount(0, $result);
	}

	public function test_on_before_play_start_event_shows_error_for_bad_oauth_request()
	{
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$event_args = ['inst_id' => $inst_id, 'is_embedded' => true];

		// Test a first launch, OAuth should fail
		\Input::_set('post', ['resource_link_id' => 'test-resource', 'lti_message_type' => 'ContentItemSelectionRequest']);
		$result = \Lti\LtiEvents::on_before_play_start_event($event_args);

		$this->assertArrayHasKey('redirect', $result);
		$this->assertCount(1, $result);
		$this->assertEquals('/lti/error?message=invalid_oauth_request', $result['redirect']);
	}

	public function test_on_before_play_start_event_throws_unknown_user_exception_for_bad_user()
	{
		\Config::set("lti::lti.consumers.default.creates_users", false);
		$user = $this->make_random_student();
		$user->username = 'non-existant-user';
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$event_args = ['inst_id' => $inst_id, 'is_embedded' => true];
		$this->create_test_oauth_launch([], \Uri::current(), $user);

		$result = \Lti\LtiEvents::on_before_play_start_event($event_args);
		$this->assertCount(1, $result);
		$this->assertArrayHasKey('redirect', $result);
		$this->assertEquals('/lti/error/unknown_user', $result['redirect']);
	}

	public function test_on_before_play_start_event_throws_unknown_assignment_exception_for_bad_assignment()
	{
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$event_args = ['inst_id' => false, 'is_embedded' => true];
		$this->create_test_oauth_launch([], \Uri::current(), $user);

		$result = \Lti\LtiEvents::on_before_play_start_event($event_args);
		$this->assertCount(1, $result);
		$this->assertArrayHasKey('redirect', $result);
		$this->assertEquals('/lti/error/unknown_assignment', $result['redirect']);
	}

	public function test_on_before_play_start_event_throws_guest_mode_exception()
	{
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$widget_instance->guest_access = true;
		$widget_instance->db_store();
		$event_args = ['inst_id' => $inst_id, 'is_embedded' => true];
		$this->create_test_oauth_launch([], \Uri::current(), $user);

		$result = \Lti\LtiEvents::on_before_play_start_event($event_args);
		$this->assertCount(1, $result);
		$this->assertArrayHasKey('redirect', $result);
		$this->assertEquals('/lti/error/guest_mode', $result['redirect']);
	}

	public function test_on_before_play_start_event_saves_lti_association_for_first_launch()
	{
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$event_args = ['inst_id' => $inst_id, 'is_embedded' => true];
		$this->create_test_oauth_launch(['resource_link_id' => $resource_id], \Uri::current(), $user);

		// No association found
		$this->assertEquals(0, \Lti\Model_Lti::query()->where('resource_link', $resource_id)->count());

		// This should store an association
		\Lti\LtiEvents::on_before_play_start_event($event_args);

		// One association found
		$this->assertEquals(1, \Lti\Model_Lti::query()->where('resource_link', $resource_id)->count());
	}

	public function test_on_play_start_event_does_nothing_when_not_lti()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		// Nothing should be in the session
		$session_data = \Session::get("lti-{$play_id}", false);
		$this->assertEquals(false, $session_data);
		$session_data = \Session::get("lti-link-{$play_id}", false);
		$this->assertEquals(false, $session_data);
	}

	public function test_on_play_start_event_stores_request_into_session_for_first_launch()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$this->create_test_oauth_launch(['resource_link_id' => $resource_id], \Uri::current(), $user);

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		$session_data = \Session::get("lti-{$play_id}", false);
		$this->assertEquals($inst_id, $session_data->inst_id);
		$this->assertEquals($resource_id, $session_data->resource_id);
	}

	public function test_on_play_start_event_links_session_data_to_play_id_for_replay()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$this->create_test_oauth_launch(['resource_link_id' => $resource_id], \Uri::current(), $user);

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		// Replay
		$this->reset_input();
		$_GET['token'] = $token = $play_id;
		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		$session_data = \Session::get("lti-link-{$play_id}", false);
		$this->assertEquals($token, $session_data);
	}

	//@TODO - How do I test the other modes (always returns false since not valid service url)
	public function test_on_score_updated_event_returns_false_when_not_lti()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		$result = \Lti\LtiEvents::on_score_updated_event([$play_id, $inst_id, $author->id, 66, 99]);
		$this->assertFalse($result);
	}

	public function test_on_play_completed_event_returns_empty_array_when_not_lti()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		\Lti\LtiEvents::on_score_updated_event([$play_id, $inst_id, $author->id, 66, 99]);

		$play = new \Materia\Session_Play();
		$play->get_by_id($play_id);
		$result = \Lti\LtiEvents::on_play_completed_event($play);
		$this->assertSame([], $result);
	}

	public function test_on_play_completed_event_returns_score_url_for_lti()
	{
		// First play
		\Config::set("lti::lti.consumers.default.creates_users", true);
		$resource_id = $this->get_uniq_string();
		$user = $this->make_random_student();
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$this->create_test_oauth_launch(['resource_link_id' => $resource_id], \Uri::current(), $user);

		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		\Lti\LtiEvents::on_play_start_event(['inst_id' => $inst_id, 'play_id' => $play_id]);

		\Lti\LtiEvents::on_score_updated_event([$play_id, $inst_id, $author->id, 66, 99]);

		$play = new \Materia\Session_Play();
		$play->get_by_id($play_id);
		$result = \Lti\LtiEvents::on_play_completed_event($play);
		$this->assertTrue(array_key_exists('score_url', $result));
	}

	public function test_on_widget_instance_delete_event()
	{
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$play_id = \Materia\Api_V1::session_play_create($inst_id);
		$resource_id = $this->get_uniq_string();
		$this->create_test_oauth_launch(['resource_link_id' => $resource_id], \Uri::current());
		\Lti\LtiEvents::on_before_play_start_event(['inst_id' => $inst_id, 'is_embedded' => true]);

		// There should be a lti association
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();
		$this->assertEquals(1, count($lti_data));

		// Trigger the event
		\Lti\LtiEvents::on_widget_instance_delete_event(['inst_id' => $inst_id]);

		// The lti association should be gone
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();
		$this->assertEquals(0, count($lti_data));
	}

	public function test_save_widget_association()
	{
		$this->_as_author();
		$widget = $this->make_disposable_widget();

		$resource_link = 'test-resource-C-'.$this->get_uniq_string();

		$assocs_before = $this->get_all_associations();

		\Config::set("lti::lti.consumers.default-test.save_assoc", true);

		// create an instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new($widget->id, 'test-instance-3', $qset, false);
		$this->assert_is_widget_instance($widget_instance);


		$launch = $this->create_testing_launch_vars($resource_link, $widget->id, '~materia_system_only', ['Learner']);
		$launch->inst_id = $widget_instance->id;

		$save_lti_resource_id_to_widget_association = static::get_protected_method('\Lti\LtiEvents', 'save_lti_association_if_needed');
		$assoc_result = $save_lti_resource_id_to_widget_association->invoke(null, $launch);
		$this->assertTrue($assoc_result);
		$this->validate_new_assocation_saved($assocs_before);
	}


	/*
	Possible inputs:
		I. An association exists with the given resource link id
		R. An association exists with the given item id

	Possible actions:
		S. If "NOT(R AND I)" Then save the association
			Either (A)dd new association or (U)pdate association

	Truth table:
		Case | I | R || S |   | English description
		================================================================
		a    | 0 | 0 || 1 | A | Totally new association
		b    | 0 | 1 || 1 | U | Update association with different widget
		c    | 1 | 0 || 1 | A | Attempting to use same item in different course
		d    | 1 | 1 || 0 | - | Association already exists - do nothing
	 */
	public function test_create_lti_association_if_needed_creates_new_association()
	{
		$create_lti_association_if_needed = static::get_protected_method('\Lti\LtiEvents', 'save_lti_association_if_needed');
		$find_assoc_from_resource_id = static::get_protected_method('\Lti\LtiEvents', 'find_assoc_from_resource_id');

		\Config::set("lti::lti.consumers.default-test.save_assoc", true);

		$resource_id = 'test-resource-A';
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$launch = $this->create_testing_launch_vars($resource_id, $author);
		$launch->inst_id = $inst_id;

		// Case a - Create a new association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);

		$assoc1 = $find_assoc_from_resource_id->invoke(null, $resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc1);
		$this->assertEquals($assoc1->resource_link, $resource_id);
		$this->assertEquals($assoc1->item_id, $inst_id);
	}

	public function test_create_lti_association_if_needed_shouldnt_modify_association_for_same_widget()
	{
		$create_lti_association_if_needed = static::get_protected_method('\Lti\LtiEvents', 'save_lti_association_if_needed');
		$find_assoc_from_resource_id = static::get_protected_method('\Lti\LtiEvents', 'find_assoc_from_resource_id');

		\Config::set("lti::lti.consumers.default-test.save_assoc", true);

		$resource_id = 'test-resource-A';
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$launch = $this->create_testing_launch_vars($resource_id, $author);
		$launch->inst_id = $inst_id;

		// Create a new association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc1 = $find_assoc_from_resource_id->invoke(null, $resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc1);
		$this->assertEquals($assoc1->resource_link, $resource_id);
		$this->assertEquals($assoc1->item_id, $inst_id);

		// Case d - Same widget, same resource link, same association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc2 = $find_assoc_from_resource_id->invoke(null, $resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc2);
		$this->assertEquals($assoc2->resource_link, $resource_id);
		$this->assertEquals($assoc2->item_id, $inst_id);
		$this->assertEquals($assoc2->id, $assoc1->id); // same row!

		// validate_no_duplicated_resource_ids
		$resource_ids = [];
		$assocs = $this->get_all_associations();
		foreach($assocs as $assoc) $resource_ids[] = $assoc->get('resource_link');
		$this->assertEquals(count($resource_ids), count(array_unique($resource_ids)));
	}

	public function test_create_lti_association_if_needed_creates_new_association_for_different_resource_link()
	{
		$create_lti_association_if_needed = static::get_protected_method('\Lti\LtiEvents', 'save_lti_association_if_needed');
		$find_assoc_from_resource_id = static::get_protected_method('\Lti\LtiEvents', 'find_assoc_from_resource_id');

		\Config::set("lti::lti.consumers.default-test.save_assoc", true);

		$resource_id = 'test-resource-A';
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$launch = $this->create_testing_launch_vars($resource_id, $author);
		$launch->inst_id = $inst_id;

		// Create a new association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc1 = $find_assoc_from_resource_id->invoke(null, $resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc1);
		$this->assertEquals($assoc1->resource_link, $resource_id);
		$this->assertEquals($assoc1->item_id, $inst_id);

		// Case c - Same widget, different resource link, makes new association
		$launch->resource_id = 'test-resource-B';
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc3 = $find_assoc_from_resource_id->invoke(null, $launch->resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc3);
		$this->assertEquals($assoc3->resource_link, $launch->resource_id);
		$this->assertEquals($assoc3->item_id, $inst_id);
		$this->assertNotEquals($assoc3->id, $assoc1->id);
	}

	public function test_create_lti_association_if_needed_updates_existing_association_for_new_widget()
	{
		$create_lti_association_if_needed = static::get_protected_method('\Lti\LtiEvents', 'save_lti_association_if_needed');
		$find_assoc_from_resource_id = static::get_protected_method('\Lti\LtiEvents', 'find_assoc_from_resource_id');

		\Config::set("lti::lti.consumers.default-test.save_assoc", true);

		$resource_id = 'test-resource-A';
		list($author, $widget_instance, $inst_id) = $this->create_instance();
		$launch = $this->create_testing_launch_vars($resource_id, $author);
		$launch->inst_id = $inst_id;

		// Create a new association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc1 = $find_assoc_from_resource_id->invoke(null, $resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc1);
		$this->assertEquals($assoc1->resource_link, $resource_id);
		$this->assertEquals($assoc1->item_id, $inst_id);

		list($author, $widget_instance, $new_inst_id) = $this->create_instance();
		$launch->inst_id = $new_inst_id;

		// Case b - New widget, same resource link, updates existing association
		$result = $create_lti_association_if_needed->invoke(null, $launch);
		$this->assertTrue($result);
		$assoc4 = $find_assoc_from_resource_id->invoke(null, $launch->resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc4);
		$this->assertEquals($assoc4->resource_link, $launch->resource_id);
		$this->assertNotEquals($assoc4->item_id, $inst_id);
		$this->assertEquals($assoc4->item_id, $new_inst_id);
		$this->assertEquals($assoc4->id, $assoc1->id);
	}

	protected function create_instance()
	{
		// create an instance
		$widget = $this->make_disposable_widget();

		$author = $this->_as_author();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new($widget->id, 'test-instance', $qset, false);

		return [$author, $widget_instance, $widget_instance->id];
	}

	protected function get_all_associations()
	{
		$assocs = \Lti\Model_Lti::find('all');

		$assocs_clone = [];

		foreach($assocs as $id => $assoc)
		{
			$assocs_clone[$id] = clone $assoc;
		}

		return $assocs_clone;
	}

	protected function validate_new_assocation_saved($assocs_before)
	{
		$assocs_now = $this->get_all_associations();
		$this->assertEquals(count($assocs_before) + 1, count($assocs_now));
	}

}
