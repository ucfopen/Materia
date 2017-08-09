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
		$user = $this->make_random_super_user();

		$x = Model_User::find_by_name_search($user->email)->as_array();
		self::assertEmpty($x);
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
	}
}
