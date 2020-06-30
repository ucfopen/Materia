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
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);

		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(true, $valid);
	}

	public function test_oauth_validate_fails_with_no_signature()
	{
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$this->unset_post_prop('oauth_signature');
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_timestamp()
	{
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$this->unset_post_prop('oauth_timestamp');
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_nonce()
	{
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$this->unset_post_prop('oauth_nonce');
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_oauth_consumer_key()
	{
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		$this->unset_post_prop('oauth_consumer_key');
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_an_old_signature()
	{
		require_once(APPPATH.'/tasks/admin.php');
		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		\Input::_set('post', ['oauth_consumer_key' => time() - 3601]);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_an_incorrect_signature()
	{
		require_once(APPPATH.'/tasks/admin.php');

		$user_id = \Fuel\Tasks\Admin::instant_user();
		$user = \Model_User::find($user_id);
		$this->create_test_oauth_launch([], \Uri::current(), $user);
		\Input::_set('post', ['oauth_signature' => 'nope']);
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

	public function test_oauth_validate_fails_with_no_arguments()
	{
		$valid = \Lti\Oauth::validate_post();
		$this->assertEquals(false, $valid);
	}

}
