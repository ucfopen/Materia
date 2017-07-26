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

	public function test_find_by_name_search()
	{
		$x = Model_User::find_by_name_search('admin')->as_array();
		self::assertEmpty($x);

		$x = Model_User::find_by_name_search('student')->as_array();
		self::assertCount(1, $x);
		self::assertInstanceOf('Model_User', $x[0]);

		$x = Model_User::find_by_name_search('auth')->as_array();
		self::assertCount(3, $x);
		self::assertInstanceOf('Model_User', $x[0]);
		self::assertInstanceOf('Model_User', $x[1]);
		self::assertInstanceOf('Model_User', $x[2]);
	}
}
