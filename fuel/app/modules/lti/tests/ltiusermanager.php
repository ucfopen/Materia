<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_LtiUserManager extends \Test_Basetest
{
	// Runs before every single test
	protected function setUp()
	{
		\Auth::forge(['driver' => 'LtiTestAuthDriver']);
		\Config::set("lti::lti.consumers.materia-test.auth_driver", 'LtiTestAuthDriver');

		parent::setUp();
	}

	public function test_authenticate_raises_exception_for_non_existant_auth_driver()
	{
		\Config::set("lti::lti.consumers.materia-test.auth_driver", 'PotatoAuthDriver');

		// Exception thrown for auth driver that can't be found
		try
		{
			$launch = $this->create_testing_launch_vars('resource-link', 1, '~admin', ['Learner']);
			\Lti\LtiUserManager::authenticate($launch);
			$this->fail('Exception expected');
		}
		catch(\Exception $e)
		{
			$this->assertEquals("Unable to find auth driver for PotatoAuthDriver", $e->getMessage());
		}
	}

	public function test_authenticate_finds_existing_user()
	{
		$test_authenticate_finds_existing_user = function($creates_users, $use_launch_roles)
		{
			\Config::set("lti::lti.consumers.materia-test.creates_users", $creates_users);
			\Config::set("lti::lti.consumers.materia-test.use_launch_roles", $use_launch_roles);

			$user = $this->create_materia_user($this->get_uniq_string(), 'gocu1@test.test', 'First', 'Last');
			$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Learner']);
			$_POST['roles'] = 'Learner';
			$launch->email = 'gocu1@test.test';

			\Lti\LtiUserManager::authenticate($launch);
			$this->assertEquals($user->id, Auth_Login_LtiTestAuthDriver::$last_force_login_user->id);
		};

		$test_authenticate_finds_existing_user(false, false);
		$test_authenticate_finds_existing_user(true, false);
		$test_authenticate_finds_existing_user(false, true);
		$test_authenticate_finds_existing_user(true, true);
	}

	public function test_authenticate_does_not_promote_student()
	{

		$test_authenticate_not_promoting_student_to_instructor = function($creates_users, $use_launch_roles)
		{
			\Config::set("lti::lti.consumers.materia-test.creates_users", $creates_users);
			\Config::set("lti::lti.consumers.materia-test.use_launch_roles", $use_launch_roles);

			$user = $this->create_materia_user($this->get_uniq_string(), 'gocu1@test.test', 'First', 'Last');
			$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Instructor']);
			$launch->email = 'gocu1@test.test';

			\Lti\LtiUserManager::authenticate($launch);
			$this->assertNotInstructor(Auth_Login_LtiTestAuthDriver::$last_force_login_user);
		};

		$test_authenticate_not_promoting_student_to_instructor(false, false);
		$test_authenticate_not_promoting_student_to_instructor(true, false);
	}

	public function test_authenticate_does_promote_student_for_createsUsers_false_useLaunchRoles_true()
	{
		$test_authenticate_promoting_student_to_instructor  = function($creates_users, $use_launch_roles)
		{
			\Config::set("lti::lti.consumers.materia-test.creates_users", $creates_users);
			\Config::set("lti::lti.consumers.materia-test.use_launch_roles", $use_launch_roles);

			$user = $this->create_materia_user($this->get_uniq_string(), 'gocu1@test.test', 'First', 'Last');
			$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Instructor']);
			$launch->email = 'gocu1@test.test';

			\Lti\LtiUserManager::authenticate($launch);
			$this->assertIsInstructor(Auth_Login_LtiTestAuthDriver::$last_force_login_user);
		};

		$test_authenticate_promoting_student_to_instructor(false, false);
		$test_authenticate_promoting_student_to_instructor(true, true);
	}

	public function test_authenticate_does_not_demote_instructor_for_createsUsers_false_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_not_demoting_instructor_to_student();
	}

	public function test_authenticate_does_not_demote_instructor_for_createsUsers_true_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_not_demoting_instructor_to_student();
	}

	public function test_authenticate_does_demote_instructor_for_createsUsers_false_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_demoting_instructor_to_student();
	}

	public function test_authenticate_does_demote_instructor_for_createsUsers_true_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_demoting_instructor_to_student();
	}

	public function test_authenticate_not_creating_students_for_createUsers_false_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_not_creating_students();
	}

	public function test_authenticate_creating_students_for_createUsers_true_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_creating_students();
	}

	public function test_authenticate_not_creating_students_for_createUsers_false_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_not_creating_students();
	}

	public function test_authenticate_creating_students_for_createUsers_true_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_creating_students();
	}

	public function test_authenticate_not_creating_instructors_for_createUsers_false_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_not_creating_instructors();
	}

	public function test_authenticate_creating_instructors_for_createUsers_true_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_creating_instructors();
	}

	public function test_authenticate_not_creating_instructors_for_createUsers_false_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_not_creating_instructors();
	}

	public function test_authenticate_creating_instructors_for_createUsers_true_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_creating_instructors();
	}

	public function test_authenticate_not_updating_user_info_for_createsUsers_false_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_not_updating_user_info();
	}

	public function test_authenticate_updating_user_info_for_createsUsers_true_useLaunchRoles_false()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", false);
		$this->authenticate_updating_user_info();
	}

	public function test_authenticate_not_updating_user_info_for_createsUsers_false_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", false);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_not_updating_user_info();
	}

	public function test_authenticate_updating_user_info_for_createsUsers_true_useLaunchRoles_true()
	{
		\Config::set("lti::lti.consumers.materia-test.creates_users", true);
		\Config::set("lti::lti.consumers.materia-test.use_launch_roles", true);
		$this->authenticate_updating_user_info();
	}

	public function test_is_lti_admin_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Administrator';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertTrue(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_instructor_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Instructor';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertTrue(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_learner_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Learner';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertFalse(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_student_not_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Student';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertFalse(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_mixed_instructor_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Instructor,Instructor';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertTrue(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_mixed_student_not_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Student,Student';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertFalse(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_unkown_not_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = '';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertFalse(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_student_admin_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Student,Learner,Administrator';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertTrue(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_instructor_student_is_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'Instructor,Student,Dogs';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertTrue(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}

	public function test_is_lti_student_daft_punk_not_content_creator()
	{
		$this->create_testing_post();
		$_POST['roles'] = 'DaftPunk,student,Shaq';
		$launch = \Lti\LtiLaunch::from_request();
		$this->assertFalse(\Lti\LtiUserManager::is_lti_user_a_content_creator($launch));
	}



	protected function authenticate_not_demoting_instructor_to_student()
	{
		$user = $this->create_materia_user($this->get_uniq_string(), 'gocu1@test.test', 'First', 'Last', true);
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Learner']);
		$launch->email = 'gocu1@test.test';

		\Lti\LtiUserManager::authenticate($launch);
		$this->assertIsInstructor(Auth_Login_LtiTestAuthDriver::$last_force_login_user);
	}

	protected function authenticate_demoting_instructor_to_student()
	{
		$user = $this->create_materia_user($this->get_uniq_string(), 'gocu1@test.test', 'First', 'Last', true);
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Learner']);
		$launch->email = 'gocu1@test.test';

		\Lti\LtiUserManager::authenticate($launch);
		$this->assertNotInstructor(Auth_Login_LtiTestAuthDriver::$last_force_login_user);
	}

	protected function authenticate_not_creating_students()
	{
		$expected_username = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $expected_username, $expected_username, ['Learner']);
		$launch->email = 'gocu1@test.test';

		$result = \Lti\LtiUserManager::authenticate($launch);
		$this->assertFalse($result);

		$user = \Model_User::query()->where('username', $expected_username)->get_one();
		$this->assertNull($user);
	}

	protected function authenticate_creating_students()
	{
		$expected_username = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $expected_username, $expected_username, ['Learner']);
		$launch->email = 'gocu1@test.test';

		$result = \Lti\LtiUserManager::authenticate($launch);
		$this->assertTrue($result);

		$user = Auth_Login_LtiTestAuthDriver::$last_force_login_user;
		$this->assertEquals($expected_username, $user->username);
		$this->assertNotInstructor($user);
	}

	protected function authenticate_not_creating_instructors()
	{
		$expected_username = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $expected_username, $expected_username, ['Instructor']);
		$launch->email = 'gocu1@test.test';

		$result = \Lti\LtiUserManager::authenticate($launch);
		$this->assertFalse($result);

		$user = \Model_User::query()->where('username', $expected_username)->get_one();
		$this->assertNull($user);
	}

	protected function authenticate_creating_instructors()
	{
		$expected_username = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $expected_username, $expected_username, ['Instructor']);
		$launch->email = 'gocu1@test.test';

		$result = \Lti\LtiUserManager::authenticate($launch);
		$this->assertTrue($result);

		$user = Auth_Login_LtiTestAuthDriver::$last_force_login_user;
		$this->assertEquals($expected_username, $user->username);
		$this->assertIsInstructor($user);
	}

	protected function authenticate_not_updating_user_info()
	{
		$user = $this->create_materia_user($this->get_uniq_string(), 'gocu3@test.test', '', 'Last');
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Learner']);
		$launch->email = 'gocu3@test.test';
		$launch->first = 'First2';

		\Lti\LtiUserManager::authenticate($launch);
		$user = Auth_Login_LtiTestAuthDriver::$last_force_login_user;
		$this->assertSame('', $user->first);
	}

	protected function authenticate_updating_user_info()
	{
		$user = $this->create_materia_user($this->get_uniq_string(), 'gocu3@test.test', '', 'Last');
		$launch = $this->create_testing_launch_vars('resource-link-gocu1', $user->username, $user->username, ['Learner']);
		$launch->email = 'gocu3@test.test';
		$launch->first = 'First2';

		\Lti\LtiUserManager::authenticate($launch);
		$user = Auth_Login_LtiTestAuthDriver::$last_force_login_user;
		$this->assertSame('First2', $user->first);
	}

	protected function assertIsInstructor($user)
	{
		return \RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id);
	}

	protected function assertNotInstructor($user)
	{
		return !$this->assertIsInstructor($user);
	}
}


class Auth_Login_LtiTestAuthDriver extends \Auth_Login_Driver
{
	public static $last_force_login_user = false;

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

	public function force_login($user_id = '')
	{
		// Expose user object that was forced to be logged in so we can query it in our tests
		$user = \Model_User::find($user_id);
		static::$last_force_login_user = $user;

		return true;
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
	public function logout() { }

}
