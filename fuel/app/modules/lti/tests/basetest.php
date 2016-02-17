<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_Basetest extends \Basetest
{
	protected $uniq_counter = 0;

	// Runs before every single test
	protected function setUp()
	{
		static::reset_input();
		parent::setUp();
	}


	protected function tearDown()
	{
		\Auth::logout();
		parent::tearDown();
	}

	protected function reset_input()
	{
		static::clear_fuel_input();
		$_POST = [];
		$_GET = [];
		$class = new ReflectionClass("\Lti\LtiLaunch");
		foreach (['launch'] as $value)
		{
			$property = $class->getProperty($value);
			$property->setAccessible(true);
			$property->setValue(null);
		}


		$class = new ReflectionClass("\Lti\LtiEvents");
		foreach (['inst_id'] as $value)
		{
			$property = $class->getProperty($value);
			$property->setAccessible(true);
			$property->setValue(null);
		}
	}

	protected static function get_protected_method($class_name, $method_name)
	{
		$class = new ReflectionClass($class_name);
		$method = $class->getMethod($method_name);
		$method->setAccessible(true);
		return $method;
	}

	protected function create_testing_launch_vars($resource_link_id = 'test-resource', $user_id = 'user', $username = 'username', $roles_array = false)
	{
		if ( ! $roles_array) $roles_array = ['Student'];

		return (object) [
			'source_id'     => 'test-source-id',
			'service_url'   => false,
			'resource_id'   => $resource_link_id,
			'context_id'    => 'test-context',
			'context_title' => 'Test Context',
			'consumer_id'   => 'test-consumer-guid',
			'consumer'      => 'materia-test',
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

	protected function create_testing_post($resource_link_id = 'test-resource', $user_id = 'user', $roles_array = false)
	{
		if ( ! $roles_array) $roles_array = ['Student'];

		$_POST['lis_person_sourcedid'] = $user_id;
		$_POST['resource_link_id'] = $resource_link_id;
		$_POST['roles'] = implode(',', $roles_array);
		$_POST['lis_result_sourcedid'] = 'lis_result_sourcedid';
		$_POST['lis_outcome_service_url'] = 'lis_outcome_service_url';
		$_POST['context_id'] = 'context_id';
		$_POST['context_title'] = 'context_title';
		$_POST['tool_consumer_instance_guid'] = 'materia-test';
		$_POST['lis_person_contact_email_primary'] = 'lis_person_contact_email_primary';
		$_POST['lis_person_name_family'] = 'lis_person_name_family';
		$_POST['lis_person_name_given'] = 'lis_person_name_given';
		$_POST['lis_person_name_full'] = 'lis_person_name_full';
		$_POST['tool_consumer_info_product_family_code'] = 'materia-test';

		static::clear_fuel_input();
	}

	protected function create_test_lti_association($launch = false, $user_id = 1)
	{
		if ( ! $launch) $launch = $this->create_testing_launch_vars();

		$assoc = \Lti\Model_Lti::forge();

		$assoc->resource_link = $launch->resource_id;
		$assoc->consumer_guid = $launch->consumer_id;
		$assoc->item_id       = $launch->inst_id;
		$assoc->user_id       = $user_id;
		$assoc->consumer      = $launch->consumer;
		$assoc->name          = $launch->fullname;
		$assoc->context_id    = $launch->context_id;
		$assoc->context_title = $launch->context_title;

		return $assoc->save();
	}

	protected function create_test_oauth_launch($custom_params, $endpoint, $user = false, $passback_url = false)
	{
		$this->reset_input();

		$key    = \Config::get('lti::lti.consumers.materia.key');
		$secret = \Config::get('lti::lti.consumers.materia.secret');

		$base_params    = [
			'resource_link_id'     => 'test-resource',
			'context_id'           => 'test-context',
			'lis_result_sourcedid' => 'test-source-id',
			'roles'                => 'Learner'
		];

		$params = array_merge($base_params, $custom_params);

		if ($user === false)
		{
			// grab our test instructor
			$user = \Model_User::query()->where('username', '_LTI_INSTRUCTOR_')->get_one();

			if ( ! $user)
			{
				trace('CREATING A USER');
				// none - make one
				$user_id = \Auth::instance()->create_user('_LTI_INSTRUCTOR_', uniqid(), '_LTI_INSTRUCTOR_@materia.com', 1, []);

				//manually add first/last name to make up for simpleauth not doing it
				$user                 = \Model_User::find($user_id);
				$user->first          = '_LTI_INSTRUCTOR_';
				$user->last           = '_LTI_INSTRUCTOR_';
				$user->profile_fields = ['notify' => true, 'avatar' => 'gravatar'];
				$user->save();

				// add basic_author permissions
				\RocketDuck\Perm_Manager::add_users_to_roles_system_only([$user_id], ['basic_author']);
			}
		}

		$post_args = \Lti\Oauth::build_post_args($user, $endpoint, $params, $key, $secret, $passback_url);

		foreach($post_args as $k => $v)
		{
			$_POST[$k] = $v;
		}

		return $post_args;
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

	protected function get_uniq_string()
	{
		$this->uniq_counter++;
		$uniq = microtime().$this->uniq_counter;
		$uniq = str_replace(' ', '-', $uniq);
		$uniq = str_replace('.', '-', $uniq);

		return $uniq;
	}
}
