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
	public function test_creating_a_user_without_password_strict()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('Username or password is not given');

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

	public function test_creating_a_user_without_username()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('Username or password is not given');

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

	public function test_creating_a_user_without_email_strict()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('Email not given');

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
		$this->assertEquals(\Materia\Perm_Manager::does_user_have_role([\Materia\Perm_Role::AUTHOR], $user->id), false);

		//promote the last user we created to an author
		$auth = \Auth::instance();
		$r = $auth::update_role($user->id, true);
		$this->assertEquals(\Materia\Perm_Manager::does_user_have_role([\Materia\Perm_Role::AUTHOR], $user->id), true);
	}

	public function test_demoting_user()
	{
		//confirm that the last user we created is not an author
		$user = $this->make_random_author();
		$this->assertEquals(\Materia\Perm_Manager::does_user_have_role([\Materia\Perm_Role::AUTHOR], $user->id), true);

		//demote the last user we created back to a student
		$auth = \Auth::instance();
		$r = $auth::update_role($user->id, false);
		$this->assertEquals(\Materia\Perm_Manager::does_user_have_role([\Materia\Perm_Role::AUTHOR], $user->id), false);
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
	public function test_update_no_user_without_username()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('No username or user provided.');

		// make different new values to update the user with
		$newValues = $this->make_user_values('GGGG', 'FFFF');
		// delete username because it cant be different
		unset($newValues['username']);

		\Auth::update_user($newValues);
	}

	//expect the appropriate exceptions when trying to update a user that doesn't exist
	public function test_update_no_user_with_username()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('Username user_Test4_McTest4 not found');

		$values = $this->make_user_values('Test4', 'McTest4');
		\Auth::update_user($values, 'user_Test4_McTest4');
	}

	//if the update_user method is called without a second argument, the current user should be modified
	public function test_can_not_update_username()
	{
		$this->expectException(\Auth\SimpleUserUpdateException::class);
		$this->expectExceptionMessage('Username cannot be changed');

		$user = $this->make_random_student();
		$new_values = $this->make_user_values('Test3', 'McTest3');

		\Auth::force_login($user->id);
		\Auth::update_user($new_values);
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

	protected function make_user_values($first, $last)
	{
		return [
			'username'       => 'user_'.$first.'_'.$last,
			'password'       => uniqid(),
			'email'          => 'email_'.$first.'_'.$last.'@fake.fake',
			'first'          => $first,
			'last'           => $last,
			'profile_fields' => []
		];
	}

	protected function make_user($first, $last)
	{
		$values = $this->make_user_values($first, $last);
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

		return [$new_user_id, $values];
	}
}
