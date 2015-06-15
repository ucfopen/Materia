<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_Api extends \Basetest
{

	public function test_allPublicAPIMethodsHaveTests()
	{
		$api_methods =  get_class_methods(new \Lti\Api);
		$test_methods = get_class_methods($this);
		foreach ($api_methods as $method)
		{
			$this->assertContains('test_'.$method, $test_methods);
		}
	}

	public function test_is_lti_launch()
	{
		$_POST['resource_link_id'] = 'test-resource';
		$_POST['tool_consumer_instance_guid'] = 'test-guid';
		$this->assertTrue(\Lti\Api::is_lti_launch());
	}

	public function test_on_send_score_event()
	{
		$this->assertFalse(\Lti\Api::on_send_score_event(['test-play-id', 5,'noone', 50, 100]));
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
		$assoc_result = \Lti\Api::save_widget_association($inst_id, $launch);
		$this->assertTrue($assoc_result);

		// now try to fetch the associated instance id
		$assoc = \Lti\Api::find_widget_from_lti_launch($launch);
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
		$result = \Lti\Api::on_play_completed_event($play);

		$this->assertTrue(is_array($result) && count($result) === 0);

		// Now test with LTI data stored:
		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];
		\Lti\Api::session_save_lti_data($launch, $play_id);
		$lti_data = \Lti\Api::session_get_lti_data($play_id);

		$result = \Lti\Api::on_play_completed_event($play);
		$ltitoken = $lti_data['token'];
		$inst_id = $widget_instance->id;

		$this->assertTrue(is_array($result) && isset($result['score_url']));
		$this->assertEquals($result['score_url'], "/scores/embed/$inst_id?ltitoken=$ltitoken#play-$play_id");
	}

	public function test_lti_user_is_content_creator()
	{
		$_POST = ['roles' => 'Administrator'];
		$this->assertTrue(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Instructor'];
		$this->assertTrue(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Learner'];
		$this->assertFalse(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Student'];
		$this->assertFalse(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Instructor,Instructor'];
		$this->assertTrue(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Student,Student'];
		$this->assertFalse(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => ''];
		$this->assertFalse(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Student,Learner,Administrator'];
		$this->assertTrue(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'Instructor,Student,Dogs'];
		$this->assertTrue(\Lti\Api::lti_user_is_content_creator());

		$_POST = ['roles' => 'DaftPunk,student,Shaq'];
		$this->assertFalse(\Lti\Api::lti_user_is_content_creator());
	}

	public function test_authenticate()
	{
		$this->assertFalse(\Lti\Api::authenticate());
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

		$search_field = \Config::get("lti::lti.consumers.materia.local_identifier", 'username');
		$auth_driver  = 'LtiTestAuthDriver';

		// Exception thrown for auth driver that can't be found
		try
		{
			$launch = $this->create_testing_launch_vars(1, '~admin', 'resource-link', ['Learner']);
			\Lti\Api::get_or_create_user($launch, $search_field, 'PotatoAuthDriver');
		}
		catch(\Exception $e)
		{
			$this->assertEquals("Unable to find auth driver for PotatoAuthDriver", $e->getMessage());
		}

		// Find existing user
		$user = $this->create_materia_user('gocu1', 'gocu1@test.test', 'First', 'Last');
		$this->assertFalse($user === false);
		\Lti\Api::clear_launch_vars();
		$_POST = [];
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$_POST['roles'] = 'Learner';
		$launch->email = 'gocu1@test.test';
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertEquals($user->id, $user2->id);

		// Fail at updating roles with config option disabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", false);
		\Lti\Api::clear_launch_vars();
		$_POST = [];
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$_POST['roles'] = 'Instructor';
		$launch->email = 'gocu1@test.test';
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertFalse($this->is_instructor($user2->id));

		// Update role (Student -> Instructor) with config option enabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", true);
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$_POST['roles'] = 'Instructor';
		$launch->email = 'gocu1@test.test';
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// Find existing instructor
		$user = $this->create_materia_user('gocu2', 'gocu2@test.test', 'First', 'Last', true);
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Instructor']);
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertSame($user, $user2);

		// Fail at updating roles with config option disabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", false);
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// // Update role (Instructor -> Student) with config option enabled
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", true);
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$user2 = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertTrue($this->is_instructor($user2->id));

		// Fail at finding a non-existant user
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars('potato', 'potato', 'resource-link-gocu1', ['Learner']);
		$user = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertFalse($user);

		// Create a new user from LTI (with creates_users = true)
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars('potato', 'potato', 'resource-link-gocu1', ['Learner']);
		$user = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver, true);
		$this->assertEquals('potato', $user->username);

		// Don't update an existing user (with creates_users = false)
		$user = $this->create_materia_user('gocu3', 'gocu3@test.test', '', 'Last');
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$launch->email = 'gocu3@test.test';
		$launch->first = 'First2';
		$user = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver);
		$this->assertSame('', $user->first);

		// Update an existing user (with creates_users = true)
		$user = $this->create_materia_user('gocu4', 'gocu4@test.test', '', 'Last');
		\Lti\Api::clear_launch_vars();
		$launch = $this->create_testing_launch_vars($user->username, $user->username, 'resource-link-gocu1', ['Learner']);
		$launch->email = 'gocu4@test.test';
		$launch->first = 'First2';
		$user = \Lti\Api::get_or_create_user($launch, $search_field, $auth_driver, true);
		$user = \Model_User::query()->where('username', 'gocu4')->get_one();
		$this->assertSame('First2', $user->first);
	}

	public function test_find_widget_from_lti_launch()
	{
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-Z';

		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);
		\Lti\Api::create_lti_association_if_needed($item_id, $launch);

		$assoc = \Lti\Api::find_widget_from_lti_launch($launch);

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
		$this->assertTrue(\Lti\Api::save_widget_association($inst_id, $launch));
		$this->validate_new_assocation_saved($assocs_before);
	}

	public function test_init_assessment_session()
	{
		// Call with nothing passed - should fail since no launch
		$this->assertFalse(\Lti\Api::init_assessment_session(false));

		// Create a valid association
		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-I';

		// Create the association
		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);
		\Lti\Api::create_lti_association_if_needed($item_id, $launch);

		// init_assessment_session gets launch vars from POST, so we need to
		// add the testing launch_vars into POST
		\Lti\Api::clear_launch_vars();
		$_POST = [];
		$_POST['resource_link_id'] = $launch->resource_id;
		$_POST['context_id'] = $launch->context_id;
		$_POST['roles'] = 'Learner';
		$_POST['tool_consumer_info_product_family_code'] = 'materia';
		$_POST['tool_consumer_instance_guid'] = 'materia';

		// Case 1: Call with a valid association
		$result = \Lti\Api::init_assessment_session($item_id);
		$this->assertEquals($result->inst_id, $item_id);

		// Case 2: Call with a valid POST parameter
		$_POST['custom_inst_id'] = $item_id;
		$result = \Lti\Api::init_assessment_session(false);
		$this->assertEquals($result->inst_id, $item_id);

		// Case 3: Call without anything, look up via resource link
		unset($_POST['custom_inst_id']);
		$result = \Lti\Api::init_assessment_session(false);
		$this->assertEquals($result->inst_id, $item_id);
	}

	protected function get_all_associations()
	{
		//return json_decode(json_encode(\Lti\Model_Lti::find('all')));
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

		// Case a - Create a new association
		$assocs_before = $this->get_all_associations();
		$number_of_assocs_before = count($assocs_before);
		$result = $this->create_testing_vars_and_create_lti_association_if_needed($original_item_id, $resource_link);
		$this->assertTrue($result);
		$this->validate_new_assocation_saved($assocs_before);

		// Case d - Same widget, same resource link
		$assocs_before = $this->get_all_associations();
		$result = $this->create_testing_vars_and_create_lti_association_if_needed($original_item_id, $resource_link);
		$this->assertTrue($result);
		$this->validate_no_new_assocation_saved($assocs_before);

		// Case c - Same widget, different resource link
		$assocs_before = $this->get_all_associations();
		$resource_link = 'test-resource-B';
		$result = $this->create_testing_vars_and_create_lti_association_if_needed($original_item_id, $resource_link);
		$this->assertTrue($result);
		$this->validate_new_assocation_saved($assocs_before);

		// create new instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_new(6, 'test-instance-2', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);
		$item_id = $widget_instance->id;
		$original_item_id = $item_id;

		// Case b - New widget, same resource link
		$assocs_before = $this->get_all_associations();
		$result = $this->create_testing_vars_and_create_lti_association_if_needed($original_item_id, $resource_link);

		$this->assertTrue($result);
		$this->validate_assocation_updated($assocs_before, $resource_link, $original_item_id);

		// Final checks
		$this->validate_no_duplicated_resource_links();
		$this->validate_number_of_lti_associations($number_of_assocs_before + 2);
	}

	public function test_save_store_lti_data()
	{
		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];
		\Lti\Api::session_save_lti_data($launch, 'test-play-id');

		$lti_data = \Lti\Api::session_get_lti_data('test-play-id');

		$this->assertEquals($launch->consumer, $lti_data['consumer']);
		$this->assertEquals($launch->service_url, $lti_data['service_url']);
		$this->assertEquals($launch->resource_id, $lti_data['resource_link_id']);
		$this->assertEquals($launch->source_id, $lti_data['source_id']);
	}

	public function test_session_get_lti_data()
	{
		// The test for store_lti_data also tests retrieve_lti_data,
		// so we don't need to test it here.
		$this->assertTrue(true);
	}

	public function test_session_link_lti_token_to_play()
	{
		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Lti\Api::session_link_lti_token_to_play($token, $play_id);

		$this->assertEquals(\Session::get("lti-$play_id", false), $token);
	}

	public function test_session_unlink_lti_token_to_play()
	{
		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Lti\Api::session_link_lti_token_to_play($token, $play_id);
		\Lti\Api::session_unlink_lti_token_to_play($play_id);

		$this->assertEquals(\Session::get("lti-$play_id", 'deleted'), 'deleted');
	}

	public function test_get_launch_vars()
	{
		\Lti\Api::clear_launch_vars();
		$_POST = ['context_id' => 'context1234'];
		$vars = \Lti\Api::get_launch_vars();
		$this->assertEquals($vars->context_id, 'context1234');
		$vars2 = \Lti\Api::get_launch_vars();
		$this->assertSame($vars, $vars2);
	}

	public function test_clear_launch_vars()
	{
		\Lti\Api::clear_launch_vars();
		$_POST = ['context_id' => 'context1234'];
		$vars = \Lti\Api::get_launch_vars();
		$this->assertEquals($vars->context_id, 'context1234');
		\Lti\Api::clear_launch_vars();
		$vars2 = \Lti\Api::get_launch_vars();
		$this->assertNotSame($vars, $vars2);
	}

	protected function create_testing_vars_and_create_lti_association_if_needed($item_id, $resource_link)
	{
		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);
		return \Lti\Api::create_lti_association_if_needed($item_id, $launch);
	}

	protected function validate_number_of_lti_associations($number)
	{
		$assocs = $this->get_all_associations();
		$this->assertTrue(count($assocs) === $number);
	}

	protected function validate_new_assocation_saved($assocs_before)
	{
		$assocs_now = $this->get_all_associations();
		$this->assertEquals(count($assocs_before) + 1, count($assocs_now));
	}

	protected function validate_no_new_assocation_saved($assocs_before)
	{
		$assocs_now = $this->get_all_associations();
		$this->assertEquals(count($assocs_before), count($assocs_now));
	}

	protected function validate_assocation_updated($assocs_before, $resource_link, $item_id)
	{
		$assocs_now = $this->get_all_associations();

		$old_assoc = false;
		$new_assoc = false;

		foreach($assocs_before as $assoc)
		{
			if($assoc->get('resource_link') == $resource_link)
			{
				$old_assoc = $assoc;
				break;
			}
		}

		foreach($assocs_now as $assoc)
		{
			if($assoc->get('resource_link') == $resource_link)
			{
				$new_assoc = $assoc;
				break;
			}
		}

		$this->assertNotEquals($old_assoc, false);
		$this->assertNotEquals($new_assoc, false);

		$this->assertNotEquals($old_assoc->get('item_id'), $new_assoc->get('item_id'));
		$this->assertEquals($new_assoc->get('item_id'), $item_id);
	}

	protected function validate_no_duplicated_resource_links()
	{
		$resource_links = [];

		$assocs = $this->get_all_associations();

		foreach($assocs as $assoc)
		{
			$resource_links[] = $assoc->get('resource_link');
		}

		$this->assertTrue(count($resource_links) === count(array_unique($resource_links)));
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
