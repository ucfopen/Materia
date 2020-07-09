<?php
/**
 * @group App
 * @group Model
 * @group Notification
 * @group Materia
 */

class Test_Model_Notification extends \Basetest
{

	public function test_get_user_or_system()
	{
        $user = $this->make_random_author();
        $result = \Model_Notification::get_user_or_system($user->id);
        $this->assertEquals($result->id, $user->id);
        $this->assertEquals($result->first, $user->first);
        $this->assertEquals($result->last, $user->last);
        $this->assertEquals($result->username, $user->username);
	}

	public function test_get_user_or_system_when_zero()
	{
        // 0 indicates the 'from' user is the server
        $user = $this->make_random_author();
        $result = \Model_Notification::get_user_or_system(0);
        $this->assertEquals($result->first, 'Materia');
        $this->assertEquals($result->last, '');
        $this->assertEquals($result->username, 'Server');
        $this->assertEquals($result->email, \Config::get('materia.system_email'));
	}

}
