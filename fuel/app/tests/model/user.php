<?php
/**
 * @group App
 * @group Model
 * @group User
 * @group Materia
 */

use \Materia\Widget_Installer;

class Test_Model_User extends \Basetest
{

	public function test_find_by_name_search_doesnt_find_super_users()
	{
		// su should't be found
		$su = $this->make_random_super_user();
		$x = Model_User::find_by_name_search($su->email)->as_array();
		self::assertEmpty($x);

		// add a student with the same name, should only find the one student
		$this->make_random_student();
		$x = Model_User::find_by_name_search('drop')->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertNotEquals($su->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_email()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_first_name()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->first)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_last_name()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->last)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students_by_username()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->username)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_students()
	{
		$user = $this->make_random_student();

		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_authors()
	{
		$user = $this->make_random_author();
		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertEquals($user->id, $x[0]->id);
	}

	public function test_find_by_name_search_finds_multiple_matches()
	{
		$user1 = $this->make_random_author();
		$user2 = $this->make_random_student();

		$x = Model_User::find_by_name_search('drop')->as_array();
		self::assertCount(2, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertInstanceOf('Model_User', $x[1]);

		$ids = [$x[0]->id, $x[1]->id];

		self::assertContains($user1->id, $ids);
		self::assertContains($user2->id, $ids);
	}

}
