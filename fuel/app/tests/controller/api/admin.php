<?php
/**
 * @group App
 * @group Api
 * @group Materia
 * @group Admin
 */
class Test_Controller_Api_Admin extends \Basetest
{
	/**
	 * @expectedException \HttpNotFoundException
	 */
	public function test_widgets_get_fails_for_students()
	{
		$this->_asStudent();

		// $test = $this->make_api_call('widgets_get', []);

		return false;
	}
	/**
	 * @expectedException \HttpNotFoundException
	 */
	public function test_widgets_get_fails_for_teachers()
	{
		$this->_asAuthor();
		$test = Controller_Api_Admin::widgets_get();

		return false;
	}
	public function test_widgets_get_succeeds_for_admins()
	{
		$this->_asSu();
		$test = Controller_Api_Admin::widgets_get();
		trace($test);
	}

	/**
	 * @expectedException \HttpNotFoundException
	 */
	public function test_users_search_fails_for_students()
	{
		$this->_asStudent();
		$test = $this->make_api_call('users_search', ['test']);

		return false;
	}

	private function make_api_call($endpoint, $payload)
	{
		$target = 'api/admin/'.$endpoint;
		trace($target);
		$req = Request::forge($target);
		$req->set_method('post');
		// $req->set_params(['data' => $payload]);
		return $req->execute($payload);
	}
}