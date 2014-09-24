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

	public function test_on_widget_instance_delete()
	{
		$this->_asAuthor();

		// create an instance
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance', $qset, false);

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
		$assoc = \Lti\Api::get_widget_association($launch);
		$this->assertEquals($inst_id, $assoc->item_id);

		// now delete the instance
		$delete_result = \Materia\Api_V1::widget_instance_delete($inst_id);
		$this->assertTrue($delete_result);

		// make sure there is no more lti association
		//\DB::delete('lti')->where('item_id', $inst_id)->execute();
		$lti_data = \DB::select()->from('lti')->where('item_id', $inst_id)->execute();
		$this->assertEquals(count($lti_data), 0);
	}

	public function test_on_play_completed()
	{
		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		$play_id = \Materia\Api_V1::session_play_create($widget_instance->id);

		$play = new \Materia\Session_Play();
		$play->get_by_id($play_id);

		// First, test when no LTI data is stored:
		$result = \Lti\Api::on_play_completed($play);

		$this->assertTrue(is_array($result) && count($result) === 0);

		// Now test with LTI data stored:
		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];
		\Lti\Api::store_lti_data($launch, $play_id);
		$lti_data = \Lti\Api::retrieve_lti_data($play_id);

		$result = \Lti\Api::on_play_completed($play);
		$ltitoken = $lti_data['token'];
		$inst_id = $widget_instance->id;

		$this->assertTrue(is_array($result) && isset($result['score_url']));
		$this->assertEquals($result['score_url'], "/scores/embed/$inst_id?ltitoken=$ltitoken");
	}

	/*
	public static function can_create()
	{
		$staff_roles   = ['Administrator', 'Instructor', 'ContentDeveloper', 'urn:lti:role:ims/lis/TeachingAssistant'];
		$student_roles = ['Student', 'Learner'];
	*/

	public function test_can_create()
	{
		$_POST = ['roles' => 'Administrator'];
		$this->assertTrue(\Lti\Api::can_create());

		$_POST = ['roles' => 'Instructor'];
		$this->assertTrue(\Lti\Api::can_create());

		$_POST = ['roles' => 'Learner'];
		$this->assertFalse(\Lti\Api::can_create());

		$_POST = ['roles' => 'Student'];
		$this->assertFalse(\Lti\Api::can_create());

		$_POST = ['roles' => 'Instructor,Instructor'];
		$this->assertTrue(\Lti\Api::can_create());

		$_POST = ['roles' => 'Student,Student'];
		$this->assertFalse(\Lti\Api::can_create());

		$_POST = ['roles' => ''];
		$this->assertFalse(\Lti\Api::can_create());

		$_POST = ['roles' => 'Student,Learner,Administrator'];
		$this->assertTrue(\Lti\Api::can_create());

		$_POST = ['roles' => 'Instructor,Student,Dogs'];
		$this->assertTrue(\Lti\Api::can_create());

		$_POST = ['roles' => 'DaftPunk,student,Shaq'];
		$this->assertFalse(\Lti\Api::can_create());
	}

	protected function create_use_launch_role_test_case($uniq_username, $uses_launch_roles, $data, $expect_instructor)
	{
		\Config::set("lti::lti.consumers.Materia.use_launch_roles", $uses_launch_roles);

		$email = substr(md5(uniqid(rand(), TRUE)), 0, 8).'@fake.fake';
		if(isset($data['ucf']))
		{
			$pid = mt_rand(1111111, 9999999);
			$query = \DB::insert('CDLPS_PEOPLE')
				->columns(['pps_number', 'network_id', 'first_name', 'middle_name', 'last_name', 'email', 'student', 'staff'])
				->values([$pid, $uniq_username, 'First', 'Middle', 'Last', $email, $data['ucf']['instructor'] ? '0' : '1', $data['ucf']['instructor'] ? '1' : '0'])
				->execute('ucf');
		}

		if(isset($data['materia']))
		{
			$query = \DB::insert('users')
				->columns(['username', 'first', 'last', 'email'])
				->values([$uniq_username, 'First', 'Last', $email])
				->execute();

			$user = \Model_User::query()->where('username', (string)$uniq_username)->get_one();
			if($data['materia']['instructor'])
			{
				\RocketDuck\Perm_Manager::add_users_to_roles_system_only([$user->id], ['basic_author']);
			}
		}

		if(isset($data['lti']))
		{
			\Lti\Api::clear_launch_vars();
			$role = $data['lti']['instructor'] ? 'Instructor' : 'Learner';
			$launch = $this->create_testing_launch_vars($uniq_username, $uniq_username, 'test-resource-'.$uniq_username, [$role]);
			$_POST['roles'] = $role;
			$launch->email = $email;
		}

		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance-'.$uniq_username, $qset, false);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-'.$uniq_username;

		// Create the association
		\Lti\Api::create_lti_association_if_needed($item_id, $launch);

		// init_assessment_session gets launch vars from POST, so we need to
		// add the testing launch_vars into POST
		\Lti\Api::clear_launch_vars();

		$local_id_field = \Config::get("lti::lti.consumers.materia.local_identifier", 'username');
		$auth_driver    = \Config::get("lti::lti.consumers.materia.auth_driver", '');
		$creates_users  = \Config::get("lti::lti.consumers.materia.creates_users");

		$user = \Lti\Api::get_or_create_user($launch, $local_id_field, $auth_driver, $creates_users);

		// Retrieve user
		$user = \Model_User::query()->where('username', $uniq_username)->get_one();

		$is_instructor = \RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id);

		$this->assertEquals($expect_instructor, $is_instructor);
	}

	protected function create_update_user_testcase($uniq_username, $creates_users, $data, $expected_name, $expected_email)
	{
		if(isset($data['ucf']))
		{
			$pid = mt_rand(1111111, 9999999);
			$query = \DB::insert('CDLPS_PEOPLE')
				->columns(['pps_number', 'network_id', 'first_name', 'middle_name', 'last_name', 'email'])
				->values([$pid, $uniq_username, $data['ucf']['first_name'], 'Middle', 'Last', $data['ucf']['email']])
				->execute('ucf');
		}

		if(isset($data['materia']))
		{
			$query = \DB::insert('users')
				->columns(['username', 'first', 'last', 'email'])
				->values([$uniq_username, $data['materia']['first_name'], 'Last', $data['materia']['email']])
				->execute();
		}

		if(isset($data['lti']))
		{
			\Lti\Api::clear_launch_vars();
			$launch = $this->create_testing_launch_vars($uniq_username, $uniq_username, 'test-resource-'.$uniq_username, ['Learner']);
			$launch->first = $data['lti']['first_name'];
			$launch->email = $data['lti']['email'];
		}

		// create instance
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance-'.$uniq_username, $qset, false);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-'.$uniq_username;

		// Create the association
		\Lti\Api::create_lti_association_if_needed($item_id, $launch);

		// init_assessment_session gets launch vars from POST, so we need to
		// add the testing launch_vars into POST
		\Lti\Api::clear_launch_vars();

		$local_id_field = \Config::get("lti::lti.consumers.materia.local_identifier", 'username');
		$auth_driver    = \Config::get("lti::lti.consumers.materia.auth_driver", '');
		//$creates_users  = \Config::get("lti::lti.consumers.materia.creates_users");

		$user = \Lti\Api::get_or_create_user($launch, $local_id_field, $auth_driver, $creates_users);

		//$this->assertTrue($auth_result);

		// Retrieve user
		$user = \Model_User::query()->where('username', $uniq_username)->get_one();

		if($expected_name === false)
		{
			$this->assertEquals(null, $user);
		}
		else
		{
			$this->assertTrue($user instanceof \Model_User);
			$this->assertEquals($expected_name, $user->first);
			$this->assertEquals($expected_email, $user->email);
		}
	}

	public function test_authenticate()
	{
		$this->assertFalse(\Lti\Api::authenticate());
	}

	public function test_get_or_create_user()
	{
		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => '', 'email' => '']
		], 'A', $username.'@materia.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => '', 'email' => '']
		], 'A', $username.'@materia.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => '', 'email' => '']
		], '', $username.'@ucf.edu'); //generated email

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, false, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => '', 'email' => '']
		], '', $username.'@ucf.edu'); //generated email



		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => '', 'email' => '']
		], 'A', $username.'@materia.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => 'A', 'email' => $username.'@materia.com'],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => '', 'email' => '']
		], 'A', $username.'@materia.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => 'B', 'email' => $username.'@lti.com'],
			'ucf'     => ['first_name' => '', 'email' => '']
		], 'B', $username.'@ucf.edu');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => 'C', 'email' => $username.'@ucf.com']
		], 'C', $username.'@ucf.com');

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_update_user_testcase($username, true, [
			'materia' => ['first_name' => '', 'email' => ''],
			'lti'     => ['first_name' => '', 'email' => ''],
			'ucf'     => ['first_name' => '', 'email' => '']
		], '', $username.'@ucf.edu'); //generated email





		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => false]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => true]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => false]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => true]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => false]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => true]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => false]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, false, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => true]
		], true);




		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => false]
		], false);

		// fails
		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => true]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => false]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => false],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => true]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => false]
		], false);

		// fails
		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => false],
			'ucf'     => ['instructor' => true]
		], false);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => false]
		], true);

		$username = substr(md5(uniqid(rand(), TRUE)), 0, 8);
		$this->create_use_launch_role_test_case($username, true, [
			'materia' => ['instructor' => true],
			'lti'     => ['instructor' => true],
			'ucf'     => ['instructor' => true]
		], true);
	}

	public function test_get_widget_association()
	{
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance', $qset, false);
		$this->assertIsWidgetInstance($widget_instance);

		// Setup some testing variables
		$item_id = $widget_instance->id;
		$resource_link = 'test-resource-Z';

		$launch = $this->create_testing_launch_vars(1, '~admin', $resource_link, ['Learner']);
		\Lti\Api::create_lti_association_if_needed($item_id, $launch);

		$assoc = \Lti\Api::get_widget_association($launch);

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
		$widget_instance = \Materia\Api_V1::widget_instance_save(3, 'test-instance-3', $qset, false);
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
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance', $qset, false);
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
		$widget_instance = \Materia\Api_V1::widget_instance_save(5, 'test-instance', $qset, false);
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
		$widget_instance = \Materia\Api_V1::widget_instance_save(6, 'test-instance-2', $qset, false);
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

	public function test_store_lti_data()
	{
		// Create some fake testing launch vars
		$launch = (object) [
			'consumer'    => 'test-consumer',
			'service_url' => 'test-service-url',
			'resource_id' => 'test-resource-id',
			'source_id'   => 'test-source-id',
		];
		\Lti\Api::store_lti_data($launch, 'test-play-id');

		$lti_data = \Lti\Api::retrieve_lti_data('test-play-id');

		$this->assertEquals($launch->consumer, $lti_data['consumer']);
		$this->assertEquals($launch->service_url, $lti_data['service_url']);
		$this->assertEquals($launch->resource_id, $lti_data['resource_link_id']);
		$this->assertEquals($launch->source_id, $lti_data['source_id']);
	}

	public function test_retrieve_lti_data()
	{
		// The test for store_lti_data also tests retrieve_lti_data,
		// so we don't need to test it here.
		$this->assertTrue(true);
	}

	public function test_associate_lti_data()
	{
		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Lti\Api::associate_lti_data($token, $play_id);

		$this->assertEquals(\Session::get("lti-$play_id", false), $token);
	}

	public function test_disassociate_lti_data()
	{
		// Create a fake token and play_id
		$token   = \Materia\Widget_Instance_Hash::generate_long_hash();
		$play_id = \Materia\Widget_Instance_Hash::generate_long_hash();

		\Lti\Api::associate_lti_data($token, $play_id);
		\Lti\Api::disassociate_lti_data($play_id);

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

	// Tests the creates_users config setting.
	//
	// User data (First, last, middle name) with creates_users = false
	// -------------------------------------------
	// MATERIA   | A |   | A | A | A |   |   |   |
	// LTI       | B | B |   | B |   | B |   |   |
	// INSTUTION | C | C | C |   |   |   | C |   |
	// -------------------------------------------
	// Result    | C | C | C | A | A |   | C |   | (= INSTUTION, MATERIA)
	//
	// User data (First, last, middle name) with creates_users = true
	// -------------------------------------------
	// MATERIA   | A |   | A | A | A |   |   |   |
	// LTI       | B | B |   | B |   | B |   |   |
	// INSTUTION | C | C | C |   |   |   | C |   |
	// -------------------------------------------
	// Result    | C | C | C | B | A | B | C |   | (= INSTUTION, LTI, MATERIA)
	//
	// Email with creates_users = false (A* = Generated Email)
	// -------------------------------------------
	// MATERIA   | A |   | A | A | A |   |   |   |
	// LTI       | B | B |   | B |   | B |   |   |
	// INSTUTION | C | C | C |   |   |   | C |   |
	// -------------------------------------------
	// Result    | C | C | C | A | A | A*| C | A*| (= INSTUTION, MATERIA, GENERATED)
	//
	// Email with creates_users = true (A* = Generated Email)
	// -------------------------------------------
	// MATERIA   | A |   | A | A | A |   |   |   |
	// LTI       | B | B |   | B |   | B |   |   |
	// INSTUTION | C | C | C |   |   |   | C |   |
	// -------------------------------------------
	// Result    | C | C | C | B | A | B | C | A*| (= INSTUTION, LTI, MATERIA, GENERATED)
	//
	// can_create with use_launch_roles = false
	// -------------------------------------------
	// MATERIA   | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
	// LTI       | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 |
	// INSTUTION | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 1 |
	// -------------------------------------------
	// Result    | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | (= INSTUITION)
	//
	// can_create with use_launch_roles = true
	// -------------------------------------------
	// MATERIA   | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 |
	// LTI       | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 |
	// INSTUTION | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 1 |
	// -------------------------------------------
	// Result    | 0 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | (= INSTUTION or LTI)
	public function test_creates_users()
	{
		$this->assertTrue(true);
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