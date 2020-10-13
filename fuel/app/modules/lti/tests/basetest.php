<?php

class Test_Basetest extends \Basetest
{
	protected $uniq_counter = 0;

	// Runs before every single test
	protected function setUp(): void
	{
		static::reset_input();
		parent::setUp();
	}


	protected function tearDown(): void
	{
		\Auth::logout();
		parent::tearDown();
	}

	protected function reset_input()
	{
		static::clear_fuel_input();
		$_POST = [];
		$_GET  = [];
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

		\Input::_set('post', [
			'lis_person_sourcedid'                   => $user_id,
			'resource_link_id'                       => $resource_link_id,
			'roles'                                  => implode(',', $roles_array),
			'lis_result_sourcedid'                   => 'lis_result_sourcedid',
			'lis_outcome_service_url'                => 'lis_outcome_service_url',
			'context_id'                             => 'context_id',
			'context_title'                          => 'context_title',
			'tool_consumer_instance_guid'            => 'materia-test',
			'lis_person_contact_email_primary'       => 'lis_person_contact_email_primary',
			'lis_person_name_family'                 => 'lis_person_name_family',
			'lis_person_name_given'                  => 'lis_person_name_given',
			'lis_person_name_full'                   => 'lis_person_name_full',
			'tool_consumer_info_product_family_code' => 'materia-test',
			'lti_message_type'                       => 'ContentItemSelectionRequest'
		]);
	}

	protected function unset_post_prop($prop)
	{
		unset($_POST[$prop]);
		static::clear_fuel_input();
		\Input::forge();
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
		\Config::load('lti::lti', true, true);

		$key    = \Config::get('lti::lti.consumers.default.key');
		$secret = \Config::get('lti::lti.consumers.default.secret');

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
			$user = \Model_User::find_by_username('_LTI_INSTRUCTOR_');

			if ( ! $user)
			{
				// none - make one
				$user_id = \Auth::instance()->create_user('_LTI_INSTRUCTOR_', uniqid(), '_LTI_INSTRUCTOR_@materia.com', 1, []);

				//manually add first/last name to make up for simpleauth not doing it
				$user                 = \Model_User::find($user_id);
				$user->first          = '_LTI_INSTRUCTOR_';
				$user->last           = '_LTI_INSTRUCTOR_';
				$user->profile_fields = ['notify' => true, 'avatar' => 'gravatar'];
				$user->save();

				// add basic_author permissions
				\Materia\Perm_Manager::add_users_to_roles_system_only([$user_id], ['basic_author']);
			}
		}

		$post_args = \Lti\Oauth::build_post_args($user, $endpoint, $params, $key, $secret, $passback_url);
		\Input::_set('post', $post_args);

		return $post_args;
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
