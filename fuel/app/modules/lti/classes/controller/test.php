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

	protected function create_test_case($custom_params, $endpoint, $user = false, $passback_url = false)
	{
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

		$params = \Lti\Oauth::build_post_args($user, $endpoint, $params, $key, $secret, $passback_url);

		return [$params, $endpoint];
	}

	protected function create_new_random_user()
	{
		$rand = substr(md5(microtime()), 0, 10);

		$user = new \Model_User([
			'username' => 'test_lti_user'.$rand,
			'email'    => 'test.lti.user'.$rand.'@materia.com',
			'first'    => 'Unofficial Test',
			'last'     => 'User'
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

	public function get_redirect()
	{
		var_dump(\Input::get());
	}

	public function get_provider()
	{
		$assignment_url = \Uri::create('lti/assignment');
		$picker_url = \Uri::create('lti/picker');
		$validate_url = \Uri::create('lti/test/validate');

		$validation_params = $this->create_test_case([], $validate_url);

		$instructor_params = $this->create_test_case([
			'launch_presentation_return_url' => \Uri::create('lti/test/redirect'),
			'selection_directive'            => 'select_link',
			'roles'                          => 'Instructor'
		], $picker_url);

		$new_instructor_params = $this->create_test_case([
			'launch_presentation_return_url' => \Uri::create('lti/test/redirect'),
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

			'new_instructor_params'       => $new_instructor_params[0],
			'new_instructor_endpoint'     => $new_instructor_params[1],

			'unknown_role_params'         => $unknown_role_params[0],
			'unknown_role_endpoint'       => $unknown_role_params[1],

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

	public function post_learner()
	{
		$lti_url = \Input::post('lti_url');
		unset($_POST['lti_url']);

		$resource_link_id = \Input::post('resource_link');
		unset($_POST['resource_link']);

		$custom_inst_id = \Input::post('custom_widget_instance_id');
		unset($_POST['custom_widget_instance_id']);

		$as_new_learner = false;
		if (\Input::post('new_learner', false))
		{
			$as_new_learner = true;
			unset($_POST['new_learner']);
		}

		$as_instructor = false;
		if (\Input::post('as_instructor', false))
		{
			$as_instructor = true;
			unset($_POST['as_instructor']);
		}

		$as_test_student = false;
		if (\Input::post('test_student', false))
		{
			$as_test_student = true;
			unset($_POST['test_student']);
		}

		if ($as_new_learner)
		{
			$learner_params = $this->create_test_case([
				'resource_link_id'          => $resource_link_id,
				'custom_widget_instance_id' => $custom_inst_id
			], $lti_url, $this->create_new_random_user());
			$learner_params[0]['user_id'] = '';
		}
		elseif ($as_instructor)
		{
			$learner_params = $this->create_test_case([
				'roles'                     => 'Instructor',
				'resource_link_id'          => $resource_link_id,
				'custom_widget_instance_id' => $custom_inst_id
			], $lti_url);
		}
		elseif ($as_test_student)
		{
			$test_student  = new \Model_User([
				'username' => '',
				'email'    => 'notifications@instructure.com',
				'first'    => 'Test',
				'last'     => 'Student'
			]);
			$learner_params = $this->create_test_case([
				'resource_link_id'          => $resource_link_id,
				'custom_widget_instance_id' => $custom_inst_id
			], $lti_url, $test_student);
			$learner_params[0]['user_id'] = '';
		}
		else
		{
			$learner_params = $this->create_test_case([
				'resource_link_id'          => $resource_link_id,
				'custom_widget_instance_id' => $custom_inst_id
			], $lti_url);
		}

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/test_learner')
			->set_safe(['post' => json_encode($learner_params[0])])
			->set(['assignment_url' => $lti_url]);

		return \Response::forge(\Theme::instance()->render());
	}

}
