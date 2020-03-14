<?php
/**
 * @group App
 * @group Materia
 * @group Auth
 * @group Ltiauth
 */
class Test_Ltiauth extends \Basetest
{
	protected $lastTestUser = null;

	protected function setUp(): void
	{
		// make sure auth config is loaded
		\Config::load('auth', true);
		// make sure restrict_logins_to_lti_single_sign_on is enabled
		\Config::set('auth.restrict_logins_to_lti_single_sign_on', true);
		parent::setUp();
	}

	protected function tearDown(): void
	{
		\Config::set('auth.restrict_logins_to_lti_single_sign_on', false);
		if ($this->lastTestUser)
		{
			\Auth::instance()->delete_user($this->lastTestUser);
		}
		parent::tearDown();
	}

	//make sure regular logins are not allowed
	public function test_normal_login()
	{
		list($id, $username, $pw) = $this->make_new_user();
		$this->expectException(\HttpServerErrorException::class);
		$this->assertEquals(\Service_User::login($username, $pw), true);
	}

	//make sure even admin logins are still restricted without using the bypass
	public function test_admin_login_without_bypass()
	{
		list($id, $username, $pw) = $this->make_new_user();
		\Materia\Perm_Manager::add_users_to_roles_system_only([$id], ['super_user']);

		$this->expectException(\HttpServerErrorException::class);
		\Service_User::login($username, $pw);
	}

	//make sure admin logins are still possible when regular logins are restricted and the bypass is used
	public function test_admin_login_with_bypass()
	{
		list($id, $username, $pw) = $this->make_new_user();
		\Materia\Perm_Manager::add_users_to_roles_system_only([$id], ['super_user']);

		Session::set_flash('bypass', true);
		$this->assertEquals(\Service_User::login($username, $pw), true);
	}

	//make sure lti logins work when regular logins are restricted
	public function test_lti_login()
	{
		list($id, $username, $pw) = $this->make_new_user();
		$this->assertEquals(\Auth::instance()->force_login($id), true);
	}

	//reusable function to make a new user for each test and pass back relevant properties
	protected function make_new_user()
	{
		$num = \Model_User::count();
		$id = \Auth::instance()->create_user(
			'LtiAuthTestUser'.$num,
			'LtiAuthTestPassword'.$num,
			'LtiAuthTestEmail'.$num.'@fake.fake',
			1,
			[],
			'LtiAuth',
			'TestUser'.$num,
			false
		);
		$this->lastTestUser = 'LtiAuthTestUser'.$num;
		return [$id, $this->lastTestUser, 'LtiAuthTestPassword'.$num];
	}
}
