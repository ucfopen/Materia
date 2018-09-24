<?php
/**
 * @group App
 * @group Materia
 * @group Validator
 */

use \Materia\Util_Validator;

class Test_Materia_Util_Validator extends TestCase
{
	public function test_is_valid_hash()
	{
		self::assertTrue(Util_Validator::is_valid_hash(1));
		self::assertTrue(Util_Validator::is_valid_hash(300));
		self::assertTrue(Util_Validator::is_valid_hash('300'));
		self::assertTrue(Util_Validator::is_valid_hash('c3tva'));
		self::assertTrue(Util_Validator::is_valid_hash(9000000));

		self::assertFalse(Util_Validator::is_valid_hash(0));
		self::assertFalse(Util_Validator::is_valid_hash('c3tva3'));
		self::assertFalse(Util_Validator::is_valid_hash(-10));
		self::assertFalse(Util_Validator::is_valid_hash('-20'));
		self::assertFalse(Util_Validator::is_valid_hash(true));
		self::assertFalse(Util_Validator::is_valid_hash(false));
	}

	public function test_is_valid_long_hash()
	{
		self::assertTrue(Util_Validator::is_valid_long_hash('300'));
		self::assertTrue(Util_Validator::is_valid_long_hash('c3tva'));
		self::assertTrue(Util_Validator::is_valid_long_hash('c3tva3'));
		self::assertTrue(Util_Validator::is_valid_long_hash('c3tva3adfadsf23raqW'));
		self::assertTrue(Util_Validator::is_valid_long_hash('12465040-9d48-4b07-a416-11dc48d64dca'));
		self::assertTrue(Util_Validator::is_valid_long_hash('02465040-9d48-4b07-a416-11dc48d64dca'));

		self::assertFalse(Util_Validator::is_valid_long_hash('-2465040-9d48-4b07-a416-11dc48d64dca'));
		self::assertFalse(Util_Validator::is_valid_long_hash('-'));
		self::assertFalse(Util_Validator::is_valid_long_hash(9000000));
		self::assertFalse(Util_Validator::is_valid_long_hash(1));
		self::assertFalse(Util_Validator::is_valid_long_hash(300));
		self::assertFalse(Util_Validator::is_valid_long_hash(0));
		self::assertFalse(Util_Validator::is_valid_long_hash(-10));
		self::assertFalse(Util_Validator::is_valid_long_hash('-20'));
		self::assertFalse(Util_Validator::is_valid_long_hash(true));
		self::assertFalse(Util_Validator::is_valid_long_hash(false));
	}

	public function test_cast_to_bool_enum_behaves_as_expected()
	{
		self::assertEquals('1', Util_Validator::cast_to_bool_enum(1));
		self::assertEquals('1', Util_Validator::cast_to_bool_enum('1'));
		self::assertEquals('1', Util_Validator::cast_to_bool_enum(true));

		self::assertEquals('0', Util_Validator::cast_to_bool_enum(false));
		self::assertEquals('0', Util_Validator::cast_to_bool_enum(0));
		self::assertEquals('0', Util_Validator::cast_to_bool_enum('0'));
	}

	public function test_is_int()
	{
		$a = -122;
		self::assertTrue(Util_Validator::is_int($a));
		$a = 0;
		self::assertTrue(Util_Validator::is_int($a));
		$a = 1;
		self::assertTrue(Util_Validator::is_int($a));
		$a = 300;
		self::assertTrue(Util_Validator::is_int($a));
		$a = '300';
		self::assertTrue(Util_Validator::is_int($a));
		$a = '-20';
		self::assertTrue(Util_Validator::is_int($a));

		$a = -2.2;
		self::assertFalse(Util_Validator::is_int($a));
		$a = 'c3tva';
		self::assertFalse(Util_Validator::is_int($a));
		$a = 1.1;
		self::assertFalse(Util_Validator::is_int($a));
		$a = true;
		self::assertFalse(Util_Validator::is_int($a));
		$a = false;
		self::assertFalse(Util_Validator::is_int($a));
	}

	public function test_is_md5()
	{
		self::assertTrue(Util_Validator::is_md5(md5('test')));

		self::assertFalse(Util_Validator::is_md5(sha1('test')));
		self::assertFalse(Util_Validator::is_md5('c3tva3'));
		self::assertFalse(Util_Validator::is_md5('c3tva3adfadsf23raqW'));
		self::assertFalse(Util_Validator::is_md5(1));
		self::assertFalse(Util_Validator::is_md5(true));
		self::assertFalse(Util_Validator::is_md5(false));
		self::assertFalse(Util_Validator::is_md5(-343));
		self::assertFalse(Util_Validator::is_md5(1.3));
	}

	public function test_is_sha1()
	{
		self::assertTrue(Util_Validator::is_sha1(sha1('test')));

		self::assertFalse(Util_Validator::is_sha1(md5('test')));
		self::assertFalse(Util_Validator::is_sha1('c3tva3'));
		self::assertFalse(Util_Validator::is_sha1('c3tva3adfadsf23raqW'));
		self::assertFalse(Util_Validator::is_sha1(1));
		self::assertFalse(Util_Validator::is_sha1(true));
		self::assertFalse(Util_Validator::is_sha1(false));
		self::assertFalse(Util_Validator::is_sha1(-343));
		self::assertFalse(Util_Validator::is_sha1(1.3));
	}

}
