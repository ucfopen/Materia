<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Test extends \Controller_Rest
{

	public function before()
	{
		if (\Fuel::$env == \Fuel::PRODUCTION)
		{
			trace('these tests are not availible in production mode');
			throw new \HttpNotFoundException;
		}
		\Js::push_group('jquery');
		parent::before();
	}

	public function get_redirect()
	{
		var_dump(\Input::get());
	}

	public function get_embed()
	{
		$embed_type = \Input::get('embed_type', false);
		$url = \Input::get('url');

		if ( $embed_type != 'basic_lti' ) return;

		$widget = str_replace(\Uri::base(false).'embed/', '', $url);
		$parts = explode('/', $widget);

		//check to see if we have an LTI association for this widget already
		// normally we would only check for 'resource_link', since an assignment can't have more than one widget associated with it
		// but for the purpose of the LTI test provider, we'll relax that requirement
		$check = Model_Lti::query()
			->where('resource_link', 'test-resource')
			->where('item_id', $parts[0])
			->get_one();

		if (empty($check))
		{
			$user = \Model_User::find_current();

			$assoc = Model_Lti::forge();
			$assoc->resource_link = 'test-resource';
			$assoc->consumer_guid = 'test';
			$assoc->item_id       = $parts[0];
			$assoc->user_id       = $user->id;
			$assoc->consumer      = 'default';
			$assoc->name          = $user->first.' '.$user->last;
			$assoc->context_id    = 'test_context';
			$assoc->context_title = 'test_context';
			$assoc->save();
		}

		return \Response::redirect("/lti/success/{$parts[0]}?embed_type={$embed_type}&url={$url}");
	}

	public function get_provider()
	{
		$assignment_url = \Uri::create('lti/assignment');
		$picker_url = \Uri::create('lti/picker');
		$validate_url = \Uri::create('lti/test/validate');
		$login_url = \Uri::create('lti/login');

		$validation_params = $this->create_test_case([], $validate_url);

		$instructor_params = $this->create_test_case([
			'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
			'selection_directive'            => 'select_link',
			'roles'                          => 'Instructor'
		], $picker_url);

		$login_params = $this->create_test_case([
			'launch_presentation_return_url' => \Uri::create('lti/test/redirect'),
			'selection_directive'            => 'select_link',
			'roles'                          => 'Instructor'
		], $login_url);

		$new_instructor_params = $this->create_test_case([
			'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
			'selection_directive'            => 'select_link',
			'roles'                          => 'Instructor'
		], $picker_url, $this->create_new_random_user());

		$unknown_role_params = $this->create_test_case(['roles' => 'Chocobo'], $assignment_url);

		$unknown_assignment_params = $this->create_test_case(['resource_link_id' => 'this-will-not-work'], $assignment_url);

		$view_args = [
			'validation_params'           => $validation_params[0],
			'validation_endpoint'         => $validation_params[1],

			'instructor_params'           => $instructor_params[0],
			'instructor_endpoint'         => $instructor_params[1],

			'login_params'                => $login_params[0],
			'login_endpoint'              => $login_params[1],

			'new_instructor_params'       => $new_instructor_params[0],
			'new_instructor_endpoint'     => $new_instructor_params[1],

			'unknown_assignment_params'   => $unknown_assignment_params[0],
			'unknown_assignment_endpoint' => $unknown_assignment_params[1],

			'learner_endpoint'            => \Uri::create('lti/test/learner')
		];

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/test_provider')
			->set($view_args);

		return \Response::forge(\Theme::instance()->render());
	}

	public function post_validate()
	{
		var_dump(\Input::post());
		echo \Lti\Oauth::validate_post() ? 'PASSED!' : 'FAILED';
	}

	protected static function get_and_unset_post($name)
	{
		$value = \Input::post($name);
		unset($_POST[$name]);
		return $value;
	}

	public function post_learner()
	{
		$lti_url          = static::get_and_unset_post('lti_url');
		if (empty($lti_url)) return \Response::forge('LTI Assignment URL can not be blank!', 500);

		$context_id       = static::get_and_unset_post('context_id');
		$resource_link_id = static::get_and_unset_post('resource_link');
		$custom_inst_id   = static::get_and_unset_post('custom_widget_instance_id');

		$use_bad_signature       = static::get_and_unset_post('use_bad_signature') ?: false;
		$as_instructor           = static::get_and_unset_post('as_instructor') ?: false;
		$as_instructor2          = static::get_and_unset_post('as_instructor2') ?: false;
		$as_test_student         = static::get_and_unset_post('test_student') ?: false;
		$as_new_learner_email    = static::get_and_unset_post('new_learner_email') ?: false;
		$as_new_learner_no_email = static::get_and_unset_post('new_learner_no_email') ?: false;

		switch (true)
		{
			case $as_instructor:
				$learner_params = $this->create_test_case([
					'roles'                     => 'Instructor',
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id
				], $lti_url);
				break;

			case $as_instructor2:
				$learner_params = $this->create_test_case([
					'roles'                     => 'Instructor',
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id
				], $lti_url, false, false, 2);
				break;

			case $as_test_student:
				$test_student  = new \Model_User([
					'username' => '',
					'email'    => 'notifications@instructure.com',
					'first'    => 'Test',
					'last'     => 'Student'
				]);
				$learner_params = $this->create_test_case([
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id
				], $lti_url, $test_student);
				$learner_params[0]['user_id'] = '';
				break;

			case $as_new_learner_email:
				$learner_params = $this->create_test_case([
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id
				], $lti_url, $this->create_new_random_user());
				$learner_params[0]['user_id'] = '';
				break;

			case $as_new_learner_no_email:
				$learner_params = $this->create_test_case([
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id
				], $lti_url, $this->create_new_random_user(false));
				$learner_params[0]['user_id'] = '';
				break;

			default:
				$learner_params = $this->create_test_case([
					'context_id'                => $context_id,
					'resource_link_id'          => $resource_link_id,
					'custom_widget_instance_id' => $custom_inst_id,
				], $lti_url);
				break;
		}

		if ($use_bad_signature)
		{
			$learner_params[0]['oauth_signature'] = 'this will fail';
		}

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/test_learner')
			->set_safe(['post' => json_encode($learner_params[0])])
			->set(['assignment_url' => $lti_url]);

		return \Response::forge(\Theme::instance()->render());
	}

	protected function create_test_case($custom_params, $endpoint, $user = false, $passback_url = false, $new_faculty_user_override_number = false)
	{
		$key    = \Config::get('lti::lti.consumers.default.key');
		$secret = \Config::get('lti::lti.consumers.default.secret');

		$base_params    = [
			'resource_link_id'     => 'test-resource',
			'context_id'           => 'test-context',
			'lis_result_sourcedid' => 'test-source-id',
			'roles'                => 'Learner'
		];

		$params = array_merge($base_params, $custom_params);

		if ($user === false || $new_faculty_user_override_number)
		{
			// grab our test instructor
			$base_username = '_LTI_INSTRUCTOR_';
			$username = $new_faculty_user_override_number ? $base_username.$new_faculty_user_override_number : $base_username;
			$user = \Model_User::find_by_username($username);

			if ( ! $user)
			{
				// none - make one
				$user_id = \Auth::instance()->create_user($username, uniqid(), $username.'@materia.com', 1, []);

				//manually add first/last name to make up for simpleauth not doing it
				$user                 = \Model_User::find($user_id);
				$user->first          = $username;
				$user->last           = $username;
				$user->profile_fields = ['notify' => true, 'avatar' => 'gravatar'];
				$user->save();

				// add basic_author permissions
				\Materia\Perm_Manager::add_users_to_roles_system_only([$user_id], ['basic_author']);
			}
		}

		$params = \Lti\Oauth::build_post_args($user, $endpoint, $params, $key, $secret, $passback_url);

		return [$params, $endpoint];
	}

	protected function create_new_random_user($with_email = true)
	{
		$rand = substr(md5(microtime()), 0, 10);

		$user = new \Model_User([
			'username' => 'test_lti_user'.$rand,
			'email'    => $with_email ? 'test.lti.user'.$rand.'@materia.com' : '',
			'first'    => 'Unofficial Test',
			'last'     => "User $rand"
		]);

		return $user;
	}

	protected function get_rand_active_widget_id()
	{
		$ids = \DB::select('id')
				->from('widget_instance')
				->where('is_draft', '0')
				->where('is_deleted', '0')
				->execute()
				->as_array();

		$item = array_rand($ids);

		return $ids[$item]['id'];
	}

}
