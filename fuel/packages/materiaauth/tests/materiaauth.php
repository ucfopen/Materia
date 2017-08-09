<?php
/**
 * @group App
 * @group Materia
 * @group Auth
  * @group MateriaAuth
 */
class Test_Materiaauth extends \Basetest
{
	public function test_creating_a_user_with_everything()
	{

		$values = $this->make_user_values('Test', 'McTest');
		$users_count = \Model_User::count();

		$new_user_id = \Auth::instance()->create_user(
			$values['username'],
			$values['password'],
			$values['email'],
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			false
		);

		//confirm we have more users than we did to start
		$this->assertEquals(\Model_User::count(), $users_count + 1);

		//confirm the new user's information matches what we said it should be
		$new_user_lookup = \Model_User::find($new_user_id);
		// clean this guy up
		$this->users_to_clean[] = $new_user_lookup;

		$confirm_properties = ['username','email','first','last'];
		foreach($confirm_properties as $prop)
		{
			$this->assertEquals($new_user_lookup[$prop], $values[$prop]);
		}
	}

	//require password - should fail
	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Username or password is not given
	 */
	public function test_creating_a_user_without_password_strict()
	{
		$values = $this->make_user_values('Test2', 'McTest2');
		$new_user_id = \Auth::instance()->create_user(
			$values['username'],
			null,
			$values['email'],
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			true
		);

		//this should not execute if the exception occurs
		return false;
	}

	//don't require password - should succeed
	public function test_creating_a_user_without_password_relaxed()
	{
		$values = $this->make_user_values('Test2', 'McTest2');
		$users_count = \Model_User::count();

		$new_user_id = \Auth::instance()->create_user(
			$values['username'],
			null,
			$values['email'],
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			false
		);

		$this->assertEquals(\Model_User::count(), $users_count + 1);

		$new_user_lookup = \Model_User::find($new_user_id);
		// clean this guy up
		$this->users_to_clean[] = $new_user_lookup;
		$confirm_properties = ['username','email','first','last'];
		foreach($confirm_properties as $prop)
		{
			$this->assertEquals($new_user_lookup[$prop], $values[$prop]);
		}
	}

	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Username or password is not given
	 */
	public function test_creating_a_user_without_username()
	{
		$values = $this->make_user_values('Test3', 'McTest3');

		$new_user_id = \Auth::instance()->create_user(
			null,
			$values['password'],
			$values['email'],
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			false
		);

		return false;
	}

	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Email not given
	 */
	public function test_creating_a_user_without_email_strict()
	{
		$values = $this->make_user_values('Test3', 'McTest3');

		$new_user_id = \Auth::instance()->create_user(
			$values['username'],
			$values['password'],
			null,
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			false,
			true
		);

		return false;
	}

	public function test_creating_a_user_without_email_relaxed()
	{
		$values = $this->make_user_values('Test3', 'McTest3');
		$users_count = \Model_User::count();

		$new_user_id = \Auth::instance()->create_user(
			$values['username'],
			$values['password'],
			null,
			1,
			$values['profile_fields'],
			$values['first'],
			$values['last'],
			false,
			false
		);

		$this->assertEquals(\Model_User::count(), $users_count + 1);

		// null emails are converted to 'false' during the email sanitizing process
		$values['email'] = false;

		$new_user_lookup = \Model_User::find($new_user_id);
		// clean this guy up
		$this->users_to_clean[] = $new_user_lookup;
		$confirm_properties = ['username','email','first','last'];
		foreach($confirm_properties as $prop)
		{
			$this->assertEquals($new_user_lookup[$prop], $values[$prop]);
		}
		$this->assertEquals($new_user_lookup['profile_fields']['notify'], false);
	}

	public function test_promoting_user()
	{
		//confirm that the last user we created is not an author
		$user = $this->make_random_student();
		$this->assertEquals(\RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id), false);

		//promote the last user we created to an author
		$auth = \Auth::instance();
		$r = $auth::update_role($user->id, true);
		$this->assertEquals(\RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id), true);
	}

	public function test_demoting_user()
	{
		//confirm that the last user we created is not an author
		$user = $this->make_random_author();
		$this->assertEquals(\RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id), true);

		//demote the last user we created back to a student
		$auth = \Auth::instance();
		$r = $auth::update_role($user->id, false);
		$this->assertEquals(\RocketDuck\Perm_Manager::does_user_have_role([\RocketDuck\Perm_Role::AUTHOR], $user->id), false);
	}

	//make sure session variables are unset when logging out
	public function test_logout()
	{
		$user = $this->make_random_student();
		//log in first
		\Auth::force_login($user->id);
		$this->assertEquals(\Session::get('username'), $user->username);

		\Auth::logout();
		$this->assertEquals(\Session::get('username'), null);
	}

	//expect the appropriate exceptions when trying to update with no user logged in
	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Username not found
	 */
	public function test_update_no_user_without_username()
	{
		$values = $this->make_user_values('Test4', 'McTest4');
		\Auth::update_user($values);

		return false;
	}

	//expect the appropriate exceptions when trying to update a user that doesn't exist
	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Username not found
	 */
	public function test_update_no_user_with_username()
	{
		$values = $this->make_user_values('Test4', 'McTest4');
		\Auth::update_user($values, 'user_Test4_McTest4');

		return false;
	}

	//if the update_user method is called without a second argument, the current user should be modified
	/**
	 * @expectedException        \Auth\SimpleUserUpdateException
	 * @expectedExceptionMessage Username cannot be changed.
	 */
	public function test_can_not_update_username()
	{
		$user = $this->make_random_student();
		$new_values = $this->make_user_values('Test3', 'McTest3');

		\Auth::force_login($user->id);
		\Auth::update_user($new_values);

		return false;
	}

	//if the update_user method is called without a second argument, the current user should be modified
	public function test_update_current_user()
	{
		$user = $this->make_random_student();
		$new_values = $this->make_user_values('Test3', 'McTest3');
		//username can't be changed
		unset($new_values['username']);

		\Auth::force_login($user->id);
		\Auth::update_user($new_values);

		$confirm_properties = ['email','first','last'];
		foreach($confirm_properties as $prop)
		{
			$this->assertEquals($user->$prop, $new_values[$prop]);
		}
	}

	public function test_update_specific_user()
	{
		$user = $this->make_random_student();
		$values = $this->make_user_values('Test5', 'McTest5');
		//username can't be changed
		unset($values['username']);

		\Auth::update_user($values, $user->username);

		$confirm_properties = ['email','first','last'];
		foreach($confirm_properties as $prop)
		{
			$this->assertEquals($user->$prop, $values[$prop]);
		}
	}

	protected function make_user_values($f, $l)
	{
		return [
			'username'       => 'user_'.$f.'_'.$l,
			'password'       => uniqid(),
			'email'          => 'email_'.$f.'_'.$l.'@fake.fake',
			'first'          => $f,
			'last'           => $l,
			'profile_fields' => []
		];
	}
}
