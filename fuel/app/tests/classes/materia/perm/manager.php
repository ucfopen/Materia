<?php
/**
 * @group App
 * @group Materia
 * @group Perm
 */

use \Materia\Perm_Manager;
use \Materia\Perm_Role;

class Test_Materia_Perm_Manager extends \Basetest
{
	public function test_create_role()
	{
		//only super users can create new roles
		$this->_as_super_user();

		//make sure a new role is created
		$newRoleCheck = Perm_Manager::create_role('new_test_role');
		$this->assertTrue($newRoleCheck);

		//make sure it returns 'false' when trying to create a role that exists already
		$existingRoleCheck = Perm_Manager::create_role('new_test_role');
		$this->assertFalse($existingRoleCheck);
	}

	public function test_is_super_user()
	{
		$this->_as_super_user();
		$this->assertTrue(Perm_Manager::is_super_user());

		$this->_as_student();
		$this->assertFalse(Perm_Manager::is_super_user());

		$this->_as_author();
		$this->assertFalse(Perm_Manager::is_super_user());
	}

	public function test_does_user_have_role()
	{
		$newSuperUser = $this->make_random_super_user();
		$superUserSuperCheck = Perm_Manager::does_user_have_role(['super_user'], $newSuperUser->id);
		$this->assertTrue($superUserSuperCheck);

		$newTeacher = $this->make_random_author();
		$teacherSuperCheck = Perm_Manager::does_user_have_role(['super_user'], $newTeacher->id);
		$this->assertFalse($teacherSuperCheck);
		$teacherBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertTrue($teacherBasicCheck);

		$newStudent = $this->make_random_student();
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertFalse($studentBasicCheck);
		$studentNoAuthCheck = Perm_Manager::does_user_have_role(['no_author'], $newStudent->id);
		$this->assertFalse($studentNoAuthCheck);

		$newNoAuth = $this->make_random_noauth();
		$noAuthBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newNoAuth->id);
		$this->assertFalse($noAuthBasicCheck);
		$noAuthNoAuthCheck = Perm_Manager::does_user_have_role(['no_author'], $newNoAuth->id);
		$this->assertTrue($noAuthNoAuthCheck);
	}

	public function test_get_user_ids_with_role()
	{
		$newSuperUser = $this->make_random_super_user();
		$superUserIds = Perm_Manager::get_user_ids_with_role('super_user');

		$this->assertContains($newSuperUser->id, $superUserIds);

		$newAuthorOne = $this->make_random_author();
		$newAuthorTwo = $this->make_random_author();
		$studentIds = Perm_Manager::get_user_ids_with_role('basic_author');

		$this->assertContains($newAuthorOne->id, $studentIds);
		$this->assertContains($newAuthorTwo->id, $studentIds);
		$this->assertCount(2, $studentIds);
	}

	public function test_get_role_id()
	{
		//this is a bit of a hack, since the order in which roles are created isn't always predictable
		// but to make sure this method works, we have to know what the role ids are
		// so we need to cheat a bit by getting them out of the database ahead of running the methods
		$preCheckQuery = \DB::select()
			->from('user_role')
			->execute();
		$roleArray = [];
		foreach ($preCheckQuery as $row)
		{
			$roleArray[$row['name']] = $row['role_id'];
		}

		$noAuthorId = Perm_Manager::get_role_id('no_author');
		$basicAuthorId = Perm_Manager::get_role_id('basic_author');
		$superUserId = Perm_Manager::get_role_id('super_user');

		$this->assertEquals($noAuthorId, $roleArray['no_author']);
		$this->assertEquals($basicAuthorId, $roleArray['basic_author']);
		$this->assertEquals($superUserId, $roleArray['super_user']);
	}

	public function test_add_users_to_roles()
	{
		//this should not work unless the user performing the action is a super user
		//make sure nothing happens when not a super user
		$newStudent = $this->make_random_student();
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertFalse($studentBasicCheck);

		Perm_Manager::add_users_to_roles([$newStudent->id], ['basic_author']);
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertFalse($studentBasicCheck);

		//make sure intended functionality works as a super user
		$this->_as_super_user();

		Perm_Manager::add_users_to_roles([$newStudent->id], ['basic_author']);
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertTrue($studentBasicCheck);
	}

	public function test_add_users_to_roles_system_only()
	{
		//same as add_users_to_roles but bypasses the super user check, so it should always work
		$newStudent = $this->make_random_student();
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertFalse($studentBasicCheck);

		Perm_Manager::add_users_to_roles_system_only([$newStudent->id], ['basic_author']);
		$studentBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newStudent->id);
		$this->assertTrue($studentBasicCheck);
	}

	public function test_get_all_roles()
	{
		//should do nothing if the current user is not a super user
		$roles = Perm_Manager::get_all_roles();
		$this->assertFalse($roles);

		//this is a bit of a hack, since the order in which roles are created isn't always predictable
		// but to make sure this method works, we have to know what the role ids are
		// so we need to cheat a bit by getting them out of the database ahead of running the methods
		$preCheckQuery = \DB::select()
			->from('user_role')
			->execute();
		$roleArray = [];
		foreach ($preCheckQuery as $row)
		{
			$roleArray[$row['name']] = $row['role_id'];
		}

		$this->_as_super_user();
		$roles = Perm_Manager::get_all_roles();

		foreach ($roles as $role)
		{
			$this->assertArrayHasKey($role->name, $roleArray);
			$this->assertEquals($roleArray[$role->name], $role->role_id);
		}
	}

	public function test_get_user_roles()
	{
		//students should have no roles
		$this->_as_student();
		$studentId = \Model_User::find_current_id();

		$roles = Perm_Manager::get_user_roles($studentId);
		$this->assertEmpty($roles);

		$newTeacher = $this->make_random_author();

		//this should return false when trying to look up somebody else's roles without being a super user
		$roles = Perm_Manager::get_user_roles($newTeacher->id);
		$this->assertFalse($roles);

		$this->_as_super_user();
		$roles = Perm_Manager::get_user_roles($newTeacher->id);

		$basicRoleId = Perm_Manager::get_role_id('basic_author');

		//author should only have one role - basic_author
		$this->assertCount(1, $roles);
		$this->assertEquals($roles[0]->name, 'basic_author');
		$this->assertEquals($roles[0]->role_id, $basicRoleId);
	}

	public function test_remove_users_from_roles()
	{
		//this should not work unless the user performing the action is a super user
		//make sure nothing happens when not a super user
		$newTeacher = $this->make_random_author();
		$authorBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertTrue($authorBasicCheck);

		Perm_Manager::remove_users_from_roles([$newTeacher->id], ['basic_author']);
		$authorBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertTrue($authorBasicCheck);

		//make sure intended functionality works as a super user
		$this->_as_super_user();

		Perm_Manager::remove_users_from_roles([$newTeacher->id], ['basic_author']);
		$authorBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertFalse($authorBasicCheck);
	}

	public function test_remove_users_from_roles_system_only()
	{
		//same as remove_users_from_roles but bypasses the super user check, so it should always work
		$newTeacher = $this->make_random_author();
		$authorBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertTrue($authorBasicCheck);

		Perm_Manager::remove_users_from_roles_system_only([$newTeacher->id], ['basic_author']);
		$authorBasicCheck = Perm_Manager::does_user_have_role(['basic_author'], $newTeacher->id);
		$this->assertFalse($authorBasicCheck);
	}

	public function test_get_user_object_perms()
	{
		$this->_as_student();
		$studentId = \Model_User::find_current_id();

		//make a new widget instance and make sure the user has the right perms to it
		$widget = $this->make_disposable_widget();
		$qset = $this->create_new_qset('test', 'test');
		$instance = \Materia\Api_V1::widget_instance_new($widget->id, 'test', $qset, true);

		//it's hardly exhaustive, but just to make sure this method works,
		// check to see if the current user has full access to the widget just created
		$perms = Perm_Manager::get_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $studentId);
		$this->assertCount(1, $perms);
		$this->assertArrayHasKey(\Materia\Perm::FULL, $perms);
		$this->assertEquals($perms[\Materia\Perm::FULL], 1);
	}

	public function test_set_user_object_perms()
	{
		$this->_as_student();

		//make a new widget instance and grant full access to another user, then make sure it stuck
		$widget = $this->make_disposable_widget();
		$qset = $this->create_new_qset('test', 'test');
		$instance = \Materia\Api_V1::widget_instance_new($widget->id, 'test', $qset, true);

		$newTeacher = $this->make_random_author();
		$newPerms = [
			\Materia\Perm::FULL => true
		];
		Perm_Manager::set_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $newTeacher->id, $newPerms);

		$perms = Perm_Manager::get_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $newTeacher->id);
		$this->assertCount(1, $perms);
		$this->assertArrayHasKey(\Materia\Perm::FULL, $perms);
		$this->assertEquals($perms[\Materia\Perm::FULL], 1);
	}

	//TODO: figure out how to test this without jumping hurdles for setup
	// public function test_set_user_game_asset_perms()
	// {

	// }

	public function test_clear_user_object_perms()
	{
		$this->_as_student();
		$studentId = \Model_User::find_current_id();

		$widget = $this->make_disposable_widget();
		$qset = $this->create_new_qset('test', 'test');
		$instance = \Materia\Api_V1::widget_instance_new($widget->id, 'test', $qset, true);

		//make sure the student user has full perms to the widget before, and no perms after
		$perms = Perm_Manager::get_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $studentId);
		$this->assertCount(1, $perms);
		$this->assertArrayHasKey(\Materia\Perm::FULL, $perms);
		$this->assertEquals($perms[\Materia\Perm::FULL], 1);

		Perm_Manager::clear_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $studentId);

		$perms = Perm_Manager::get_user_object_perms($instance->id, \Materia\Perm::INSTANCE, $studentId);
		$this->assertCount(0, $perms);
	}
}