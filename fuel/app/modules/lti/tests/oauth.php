<?php
/**
 * @group App
 * @group Module
 * @group Lti
 * @group Oauth
 */
class Test_Oauth extends \Test_Basetest
{
	public function test_oauth_validate_passes_when_expected()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);

		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(true, $valid);
	}

	public function test_oauth_validate_fails_with_no_signature()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		unset($_POST['oauth_signature']);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_timestamp()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		unset($_POST['oauth_timestamp']);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_nonce()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		unset($_POST['oauth_nonce']);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_consumer_key()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		unset($_POST['oauth_consumer_key']);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_an_old_signature()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');
		$lti_config = \Config::get("lti::lti.consumers.".\Input::post('tool_consumer_info_product_family_code', 'default'));

		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$_POST['oauth_consumer_key'] = time() - $lti_config['oauth_signature'] - 1;
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_an_incorrect_signature()
	{
		require_once(PKGPATH.'materia/tasks/admin.php');

		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$_POST['oauth_signature'] = 'nope';
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_arguments()
	{
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

}
