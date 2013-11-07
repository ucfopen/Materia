<?php
/**
 * @group App
 * @group Materia
 */
class Test_RocketDuck_Util_Validator extends TestCase
{
	public function test_is_valid_hash()
	{
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash(0));
		$this->assertTrue(\RocketDuck\Util_Validator::is_valid_hash(1));
		$this->assertTrue(\RocketDuck\Util_Validator::is_valid_hash(300));
		$this->assertTrue(\RocketDuck\Util_Validator::is_valid_hash('300'));
		$this->assertTrue(\RocketDuck\Util_Validator::is_valid_hash('c3tva'));
		$this->assertTrue(\RocketDuck\Util_Validator::is_valid_hash(9000000));
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash('c3tva3'));
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash(-10));
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash('-20'));
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash(true));
		$this->assertFalse(\RocketDuck\Util_Validator::is_valid_hash(false));
	}

}