<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_Lti extends \Basetest
{

	// Runs before every single test
	protected function setUp()
	{
		$_POST = [];
		$_GET = [];
		static::clear_fuel_input();
		parent::setUp();
	}

	protected function tearDown()
	{
		\Fuel::$is_cli = false;
		\Auth::logout();
		parent::tearDown();
	}


	public function test_on_send_score_event()
	{
		$this->assertFalse(\Lti\Lti::on_send_score_event(['test-play-id', 5,'noone', 50, 100]));
	}

	public function test_on_play_start_event()
	{
		$play_id   = 'PLAY_ID_TEST';
		$lti_token = 'fffXXX';

		$_GET['ltitoken'] = $lti_token;
		\Lti\Lti::on_play_start_event($play_id);

		$session_get_lti_token_from_play = static::get_protected_method('\Lti\Lti', 'session_get_lti_token_from_play');
		$result_lti_token = $session_get_lti_token_from_play->invoke(null, $play_id);

		$session_unlink_lti_token_to_play = static::get_protected_method('\Lti\Lti', 'session_unlink_lti_token_to_play');
		$session_unlink_lti_token_to_play->invoke(null, $play_id);

		$this->assertEquals($result_lti_token, $lti_token);
		unset($_GET['ltitoken']);
	}

	public function test_on_play_start_event_failure()
	{
		$play_id = 10;
		$lti_token = 'fffXXX';

		\Lti\Lti::on_play_start_event($play_id);

		$session_get_lti_token_from_play = static::get_protected_method('\Lti\Lti', 'session_get_lti_token_from_play');
		$result_lti_token = $session_get_lti_token_from_play->invoke(null, $play_id);

		$session_unlink_lti_token_to_play = static::get_protected_method('\Lti\Lti', 'session_unlink_lti_token_to_play');
		$session_unlink_lti_token_to_play->invoke(null, $play_id);

		$this->assertFalse($result_lti_token);
	}

	public function test_on_widget_instance_delete_event()
	{
		$this->_asAuthor();

		// create an instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);

		$this->assertIsWidgetInstance($widget_instance);
		$inst_id = $widget_instance->id;

		// fake some post data
		$_POST['custom_widget_instance_id'] = $inst_id;
		$_POST['resource_link_id'] = -1;
		$_POST['tool_consumer_instance_guid'] = -1;
		$_POST['tool_consumer_info_product_family_code'] = -1;
		$launch = $this->create_testing_launch_vars(1, '~admin', 'test-resource', ['Learner']);

		// associate the lti to the widget
		$save_lti_resource_id_to_widget_association = static::get_protected_method('\Lti\Lti', 'save_lti_resource_id_to_widget_association');
		$assoc_result = $save_lti_resource_id_to_widget_association->invoke(null, $inst_id, $launch);

		$this->assertTrue($assoc_result);

		// now try to fetch the associated instance id
		$find_widget_from_resource_id = static::get_protected_method('\Lti\Lti', 'find_widget_from_resource_id');
		$assoc = $find_widget_from_resource_id->invoke(null, $launch->resource_id);
		$this->assertEquals($inst_id, $assoc->item_id);

		// now delete the instance
		$delete_result = \Materia\Api_V1::widget_instance_delete($inst_id);
		$this->assertTrue($delete_result);

		// make sure there is no more lti association
		//\DB::delete('lti')->where('item_id', $inst_id)->execute();
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();
		$this->assertEquals(count($lti_data), 0);
	}

	public function test_on_play_completed_event()
	{
		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		$play_id = \Materia\Api_V1::session_play_create($widget_instance->id);

		$play = new \Materia\Session_Play();
		$play->get_by_id($play_id);

		// First, test when no LTI data is stored:
		$result = \Lti\Lti::on_play_completed_event($play);

		$this->assertTrue(is_array($result) && count($result) === 0);

		// Now test with LTI data stored:
		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];

		$session_save_lti_data = static::get_protected_method('\Lti\Lti', 'session_save_lti_data');
		$session_save_lti_data->invoke(null, $launch, $play_id);

		$session_get_lti_data = static::get_protected_method('\Lti\Lti', 'session_get_lti_data');
		$lti_data = $session_get_lti_data->invoke(null, $play_id);

		$result = \Lti\Lti::on_play_completed_event($play);
		$ltitoken = $lti_data['token'];
		$inst_id = $widget_instance->id;

		$this->assertTrue(is_array($result) && isset($result['score_url']));
		$this->assertEquals($result['score_url'], "/scores/embed/$inst_id?ltitoken=$ltitoken#play-$play_id");
	}

	public function test_get_widget_from_request()
	{
		$this->markTestIncomplete('TODO!!!');
	}

	public function test_is_lti_admin_is_content_creator()
	{
		$_POST = ['roles' => 'Administrator'];
		$this->assertTrue(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_instructor_is_content_creator()
	{
		$_POST = ['roles' => 'Instructor'];
		$this->assertTrue(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_learner_is_content_creator()
	{
		$_POST = ['roles' => 'Learner'];
		$this->assertFalse(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_student_not_content_creator()
	{
		$_POST = ['roles' => 'Student'];
		$this->assertFalse(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_mixed_instructor_is_content_creator()
	{
		$_POST = ['roles' => 'Instructor,Instructor'];
		$this->assertTrue(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_mixed_student_not_content_creator()
	{
		$_POST = ['roles' => 'Student,Student'];
		$this->assertFalse(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_unkown_not_content_creator()
	{
		$_POST = ['roles' => ''];
		$this->assertFalse(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_student_admin_is_content_creator()
	{
		$_POST = ['roles' => 'Student,Learner,Administrator'];
		$this->assertTrue(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_instructor_student_is_content_creator()
	{
		$_POST = ['roles' => 'Instructor,Student,Dogs'];
		$this->assertTrue(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_is_lti_student_daft_punk_not_content_creator()
	{
		$_POST = ['roles' => 'DaftPunk,student,Shaq'];
		$this->assertFalse(\Lti\Lti::is_lti_user_a_content_creator());
	}

	public function test_authenticate()
	{
		$this->assertFalse(\Lti\Lti::authenticate());
	}

	protected function create_materia_user($username, $email, $first, $last, $make_instructor = false)
	{
		$user = \Model_User::forge([
			'username'        => (string) $username,
			'first'           => (string) $first,
			'last'            => (string) $last,
			'password'        => uniqid(),
			'email'           => $email,
			'group'           => 1,
			'profile_fields'  => [],
			'last_login'      => 0,
			'login_hash'      => '',
		]);

		// save the new user record
		try
		{
			$result = $user->save();
		}
		catch (\Exception $e)
		{
			$result = false;
		}

		if($make_instructor)
		{
			$result = \RocketDuck\Perm_Manager::add_users_to_roles_system_only([$user->id], ['basic_author']);

			if(!$result)
			{
				return false;
			}
		}

		return $user;
	}

	protected function is_instructor($user_id)
	{
		return \RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user_id);
	}

	public function test_get_or_create_user()
	{
		\Auth::forge(['driver' => 'LtiTestAuthDriver']);
		$get_or_create_user = static::get_protected_method('\Lti\Lti', 'get_or_create_user');

		$search_field = \Config::get("lti::lti.consumers.materia.local_identifier", 'username');
		$auth_driver  = 'LtiTestAuthDriver';

		// Exception thrown for auth driver that can't be found
		try
		{
			$launch = $this->create_testing_launch_vars(1, '~admin', 'resource-link', ['Learner']);
			$lti_data = $get_or_create_user->invoke(null, $launch, $search_field, 'PotatoAuthDriver');
			$this->fail('Exception expected');
		}
		catch(\Exception $e)
		{
			$this->assertEquals("Unable to find auth driver for PotatoAuthDriver", $e->getMessage());
		}

		// Find existing user
		$user = $this->create_materia_user('gocu1', 'gocu1@test.test', 'First', 'Last');
		$this->assertInstanceOf('Model_User', $user);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$_POST = [];
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$_POST['roles'] = 'Learner';
		$launch->email = 'gocu1@test.test';

		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertEquals($user->id, $user2->id);

		// Fail at updating roles with config option disabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", false);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$_POST = [];
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$_POST['roles'] = 'Instructor';
		$launch->email = 'gocu1@test.test';

		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertFalse($this->is_instructor($user2->id));

		// Update role (Student -> Instructor) with config option enabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", true);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$_POST['roles'] = 'Instructor';
		$launch->email = 'gocu1@test.test';
		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// Find existing instructor
		$user = $this->create_materia_user('gocu2', 'gocu2@test.test', 'First', 'Last', true);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertSame($user, $user2);

		// Fail at updating roles with config option disabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", false);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// // Update role (Instructor -> Student) with config option enabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", true);
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$user2 = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// Fail at finding a non-existant user
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars('potato', 'potato', 'resource-link-gocu1', ['Learner']);
		$user = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertFalse($user);

		// Create a new user from LTI (with creates_users = true)
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars('potato', 'potato', 'resource-link-gocu1', ['Learner']);
		$user = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver, true);
		$this->assertEquals('potato', $user->username);

		// Don't update an existing user (with creates_users = false)
		$user = $this->create_materia_user('gocu3', 'gocu3@test.test', '', 'Last');
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$launch->email = 'gocu3@test.test';
		$launch->first = 'First2';
		$user = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver);
		$this->assertSame('', $user->first);

		// Update an existing user (with creates_users = true)
		$user = $this->create_materia_user('gocu4', 'gocu4@test.test', '', 'Last');
		static::clear_protected_lti_vars();
		static::clear_fuel_input();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$launch->email = 'gocu4@test.test';
		$launch->first = 'First2';
		$user = $get_or_create_user->invoke(null, $launch, $search_field, $auth_driver, true);
		$user = \Model_User::query()->where('username', 'gocu4')->get_one();
		$this->assertSame('First2', $user->first);
	}

	public function test_find_widget_from_resource_id()
	{
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-Z';

		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);

		$create_lti_association_if_needed = static::get_protected_method('\Lti\Lti', 'create_lti_association_if_needed');
		$create_lti_association_if_needed->invoke(null, $item_id, $launch);

		$find_widget_from_resource_id = static::get_protected_method('\Lti\Lti', 'find_widget_from_resource_id');
		$assoc = $find_widget_from_resource_id->invoke(null, $launch->resource_id);

		$this->assertEquals($assoc->item_id, $item_id);
		$this->assertEquals($assoc->resource_link, $resource_link);
	}

	public function test_save_widget_association()
	{
		$this->_asAuthor();

		$resource_link = 'test-resource-C';

		$assocs_before = $this->get_all_associations();

		// create an instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(3, 'test-instance-3', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);
		$inst_id = $widget_instance->id;

		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);
		$save_lti_resource_id_to_widget_association = static::get_protected_method('\Lti\Lti', 'save_lti_resource_id_to_widget_association');
		$assoc_result = $save_lti_resource_id_to_widget_association->invoke(null, $inst_id, $launch);
		$this->assertTrue($assoc_result);
		$this->validate_new_assocation_saved($assocs_before);
	}

	 /**
     * @expectedException \Fuel\Core\HttpNotFoundException
     */
	public function test_init_assessment_session_failure()
	{
		// Call with nothing passed - should fail since no launch
		$this->assertFalse(\Lti\Lti::init_assessment_session(false));
	}

	public function test_init_assessment_session()
	{
		// Create a valid association
		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-I';

		// init_assessment_session gets launch vars from POST, so we need to
		// add the testing launch_vars into POST
		static::clear_protected_lti_vars();
		$_POST = [];
		$_POST['resource_link_id'] = $resource_link;
		$_POST['context_id'] = 'test-context';
		$_POST['roles'] = 'Learner';
		$_POST['tool_consumer_info_product_family_code'] = 'materia';
		$_POST['tool_consumer_instance_guid'] = 'materia';

		// Case 1: no custom widget instance, no association
		try {
			$result = \Lti\Lti::init_assessment_session(false);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		}
		catch ( Exception $e)
		{
			$this->assertInstanceOf('\Fuel\Core\HttpNotFoundException', $e);
		}

		// Case 2: No existing association, custom_widget_instance_id
		static::clear_fuel_input();
		static::clear_protected_lti_vars();
		$_POST['custom_widget_instance_id'] = $item_id;
		$this->assertEquals($item_id, \Lti\Lti::get_widget_from_request());

		static::clear_fuel_input();
		static::clear_protected_lti_vars();
		$result = \Lti\Lti::init_assessment_session(\Lti\Lti::get_widget_from_request());
		$this->assertEquals($result->inst_id, $item_id);

		// Case 3: Association created in case 2 should work without custom post
		unset($_POST['custom_widget_instance_id']);
		static::clear_fuel_input();
		static::clear_protected_lti_vars();
		$result = \Lti\Lti::init_assessment_session($item_id);
		$this->assertEquals($result->inst_id, $item_id);

		// Case 4: widget explicitly set inp post
		$_POST['widget'] = $item_id;
		static::clear_protected_lti_vars();
		$result = \Lti\Lti::init_assessment_session(\Lti\Lti::get_widget_from_request());
		$this->assertEquals($result->inst_id, $item_id);
		unset($_POST['widget']);

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
	public function test_create_lti_association_if_needed()
	{
		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$original_item_id = $item_id;
		$resource_link = 'test-resource-A';

		$launch = (object) [
			'consumer'      => 'test-consumer',
			'service_url'   => 'test-service-url',
			'resource_id'   => $resource_link ,
			'source_id'     => 'test-source-id',
			'consumer_id'   => 'test-consumer-id',
			'fullname'      => 'full name',
			'context_id'    => 'some-context-id',
			'context_title' => 'association_test_context_title'
		];

		$find_widget_from_resource_id = static::get_protected_method('\Lti\Lti', 'find_widget_from_resource_id');

		// Case a - Create a new association
		$create_lti_association_if_needed = static::get_protected_method('\Lti\Lti', 'create_lti_association_if_needed');
		$result = $create_lti_association_if_needed->invoke(null, $original_item_id, $launch);
		$this->assertTrue($result);
		$assoc1 = $find_widget_from_resource_id->invoke(null, $resource_link);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc1);
		$this->assertEquals($assoc1->resource_link, $resource_link);
		$this->assertEquals($assoc1->item_id, $item_id);

		// Case d - Same widget, same resource link, same association
		$create_lti_association_if_needed = static::get_protected_method('\Lti\Lti', 'create_lti_association_if_needed');
		$result = $create_lti_association_if_needed->invoke(null, $original_item_id, $launch);
		$this->assertTrue($result);
		$assoc2 = $find_widget_from_resource_id->invoke(null, $resource_link);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc2);
		$this->assertEquals($assoc2->resource_link, $resource_link);
		$this->assertEquals($assoc2->item_id, $item_id);
		$this->assertEquals($assoc2->id, $assoc1->id); // same row!

		// Case c - Same widget, different resource link, makes new association
		$launch->resource_id = 'test-resource-B';
		$create_lti_association_if_needed = static::get_protected_method('\Lti\Lti', 'create_lti_association_if_needed');
		$result = $create_lti_association_if_needed->invoke(null, $original_item_id, $launch);
		$this->assertTrue($result);
		$assoc3 = $find_widget_from_resource_id->invoke(null, $launch->resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc3);
		$this->assertEquals($assoc3->resource_link, $launch->resource_id);
		$this->assertEquals($assoc3->item_id, $item_id);
		$this->assertNotEquals($assoc3->id, $assoc1->id);
		$this->assertNotEquals($assoc3->id, $assoc2->id);

		// Case b - New widget, same resource link, updates existing association
		// create new instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(6, 'test-instance-2', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		$create_lti_association_if_needed = static::get_protected_method('\Lti\Lti', 'create_lti_association_if_needed');
		$result = $create_lti_association_if_needed->invoke(null, $widget_instance->id, $launch);
		$this->assertTrue($result);
		$assoc4 = $find_widget_from_resource_id->invoke(null, $launch->resource_id);
		$this->assertInstanceOf('\Lti\Model_Lti', $assoc4);
		$this->assertEquals($assoc4->resource_link, $launch->resource_id);
		$this->assertNotEquals($assoc4->item_id, $item_id);
		$this->assertEquals($assoc4->item_id, $widget_instance->id);
		$this->assertNotEquals($assoc4->id, $assoc1->id);
		$this->assertNotEquals($assoc4->id, $assoc2->id);
		$this->assertEquals($assoc4->id, $assoc3->id);

		// validate_no_duplicated_resource_links
		$resource_links = [];
		$assocs = $this->get_all_associations();
		foreach($assocs as $assoc) $resource_links[] = $assoc->get('resource_link');
		$this->assertEquals(count($resource_links), count(array_unique($resource_links)));

		// validate_number_of_lti_associations
		$new_association_count = \Lti\Model_Lti::query()->where('context_title', $launch->context_title)->count();

		$this->assertEquals($new_association_count, 2);
	}

	public function test_save_store_lti_data()
	{
		$session_save_lti_data = static::get_protected_method('\Lti\Lti', 'session_save_lti_data');
		$session_get_lti_data = static::get_protected_method('\Lti\Lti', 'session_get_lti_data');

		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];

		$session_save_lti_data->invoke(null, $launch, 'test-play-id');

		$lti_data = $session_get_lti_data->invoke(null, 'test-play-id');

		$this->assertEquals($launch->consumer, $lti_data['consumer']);
		$this->assertEquals($launch->service_url, $lti_data['service_url']);
		$this->assertEquals($launch->resource_id, $lti_data['resource_link_id']);
		$this->assertEquals($launch->source_id, $lti_data['source_id']);
	}

	public function test_session_get_lti_data()
	{
		// The test for store_lti_data also tests retrieve_lti_data,
		// so we don't need to test it here.
		$this->markTestIncomplete('TODO');
	}

	public function test_session_link_lti_token_to_play()
	{
		$session_link_lti_token_to_play = static::get_protected_method('\Lti\Lti', 'session_link_lti_token_to_play');

		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		$session_link_lti_token_to_play->invoke(null, $token, $play_id);

		$this->assertEquals(\Session::get("lti-$play_id", false), $token);
	}

	public function test_session_unlink_lti_token_to_play()
	{
		$session_link_lti_token_to_play = static::get_protected_method('\Lti\Lti', 'session_link_lti_token_to_play');
		$session_unlink_lti_token_to_play = static::get_protected_method('\Lti\Lti', 'session_unlink_lti_token_to_play');

		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		$session_link_lti_token_to_play->invoke(null, $token, $play_id);
		$session_unlink_lti_token_to_play->invoke(null, $play_id);

		$this->assertEquals(\Session::get("lti-$play_id", 'deleted'), 'deleted');
	}

	public function test_get_launch_vars()
	{
		static::clear_protected_lti_vars();
		$_POST = ['context_id' => 'context1234'];
		$vars = \Lti\Lti::get_launch_vars();
		$this->assertEquals($vars->context_id, 'context1234');
		$vars2 = \Lti\Lti::get_launch_vars();
		$this->assertSame($vars, $vars2);
	}

	protected function validate_new_assocation_saved($assocs_before)
	{
		$assocs_now = $this->get_all_associations();
		$this->assertEquals(count($assocs_before) + 1, count($assocs_now));
	}

	protected function create_testing_launch_vars($user_id, $username, $resource_link_id, $roles_array)
	{
		return (object) [
			'source_id'     => 'test-source-id',
			'service_url'   => false,
			'resource_id'   => $resource_link_id,
			'context_id'    => 'test-context',
			'context_title' => 'Test Context',
			'consumer_id'   => 'test-consumer-guid',
			'consumer'      => 'Materia',
			'inst_id'       => false,
			'email'         => 'fake@fake.fake',
			'last'          => 'Lastname',
			'first'         => 'Firstname',
			'fullname'      => 'Firstname Lastname',
			'roles'         => $roles_array,
			'remote_id'     => $user_id,
			'username'      => $username,
		];
	}

	protected function get_associations_for_original_item_id($original_item_id)
	{
		$associations_for_original_item_id = Model_Lti::find('all', [
				'where' => [['original_item_id', $original_item_id]]
				]);

		return $associations_for_original_item_id;
	}

	protected static function get_protected_method($class_name, $method_name)
	{
		$class = new ReflectionClass($class_name);
		$method = $class->getMethod($method_name);
		$method->setAccessible(true);
		return $method;
	}

	protected static function clear_protected_lti_vars()
	{
		// reset protected static lti_vars
		$class = new ReflectionClass("\Lti\Lti");
		$property = $class->getProperty("lti_vars");
		$property->setAccessible(true);
		$property->setValue(null);
	}
}





class Auth_Login_LtiTestAuthDriver extends \Auth_Login_Driver
{
	public function get_id()
	{
		return 'LtiTestAuthDriver';
	}

	public function validate_user($username_or_email = '', $password = '')
	{
		return false;
	}

	public function create_user($username, $password, $email, $group = 1, Array $profile_fields = [])
	{
		$user = array(
			'username'        => (string) $username,
			'password'        => $password,
			'email'           => $email,
			'group'           => (int) $group,
			'profile_fields'  => serialize($profile_fields),
			'last_login'      => 0,
			'login_hash'      => '',
			'created_at'      => \Date::forge()->get_timestamp()
		);
		$result = \DB::insert('users')
			->set($user)
			->execute();

		return ($result[1] > 0) ? $result[0] : false;
	}

	public function update_user($values, $username = null)
	{
		$username = $username ?: $this->user['username'];
		$user     = \Model_User::query()->where('username', $username)->get_one();

		if ( ! $user) throw new \Exception('Username not found', 4);

		// save the new user record
		try
		{
			$user->set($values);
			$user->save();
		}
		catch (\Exception $e)
		{
			return false;
		}
	}

	public function update_role($user_id, $is_employee = false)
	{
		$user = \Model_User::find($user_id);

		// grab our user first to see if overrrideRoll has been set to 1
		if ($user instanceof \Model_User)
		{
			// add employee role
			if ($is_employee)
			{
				return \RocketDuck\Perm_Manager::add_users_to_role_system_only([$user->id], \RocketDuck\Perm_Role::AUTHOR);
			}
			// not an employee anymore, remove role
			else
			{
				return \RocketDuck\Perm_Manager::remove_users_from_roles_system_only([$user->id], [\RocketDuck\Perm_Role::AUTHOR]);
			}
		}
	}

	public function change_password() { }
	public function reset_password() { }
	public function delete_user() { }
	public function perform_check() { }
	public function get_user_id() { }
	public function get_groups() { }
	public function get_email() { }
	public function get_screen_name() { }
	public function login($username_or_email = '', $password = '') { }
	public function force_login($user_id = '') { }
	public function logout() { }

}
