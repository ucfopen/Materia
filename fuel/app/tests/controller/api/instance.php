<?php
/**
 * @group App
 * @group Api
 * @group Materia
 * @group Instance
 */

use \Materia\Api_V1;

class Test_Controller_Api_Instance extends \Basetest
{
	public function test_get_history()
	{
		$_SERVER['HTTP_ACCEPT'] = 'application/json';

		// ======= NO INST ID PROVIDED ========
		$response = Request::forge('/api/instance/history')
			->set_method('GET')
			->execute()
			->response();

		$this->assertEquals($response->status, 401);
		$this->assertEquals($response->body, '"Requires an inst_id parameter!"');

		// ======= NO INST ID FOUND ========
		$response = Request::forge('/api/instance/history')
			->set_method('GET')
			->set_get('inst_id', 555)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$this->assertEquals($response->body, '"Instance not found"');

		// == Now we're an author
		$this->_as_author();

		// == Make a widget instance
		$widget = $this->make_disposable_widget();
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);
		$instance = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		// ======= SUCCESSFUL REQUEST ========
		$response = Request::forge('/api/instance/history')
			->set_method('GET')
			->set_get('inst_id', $instance->id)
			->execute()
			->response();

		$output = json_decode($response->body);

		$this->assertEquals($response->status, 200);
		$this->assertTrue(is_array($output));
		$this->assertCount(1, $output);
	}

	public function test_post_request_access()
	{
		$_SERVER['HTTP_ACCEPT'] = 'application/json';

		// ======= NO INST ID PROVIDED ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->execute()
			->response();

		$this->assertEquals($response->status, 401);
		$this->assertEquals($response->body, '"Requires an inst_id parameter"');

		// ======= NO OWNER ID PROVIDED ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_post('inst_id', 555)
			->execute()
			->response();

		$this->assertEquals($response->status, 401);
		$this->assertEquals($response->body, '"Requires an owner_id parameter"');

		// ======= NO INST ID FOUND ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_post('inst_id', 555)
			->set_post('owner_id', 111)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$this->assertEquals($response->body, '"Instance not found"');

		// == Now we're an author
		$this->_as_student();

		// == Make a widget instance
		$widget = $this->make_disposable_widget();
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);
		$instance = Api_V1::widget_instance_new($widget->id, $title, $qset, false);
		$student_id = \Model_User::find_current_id();

		// ======= NO OWNER ID FOUND ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_post('inst_id', $instance->id)
			->set_post('owner_id', 111)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$this->assertEquals($response->body, '"Owner not found"');

		// ======= OWNER DOES NOT OWN INSTANCE =========
		$this->_as_author();

		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_post('inst_id', $instance->id)
			->set_post('owner_id', 111)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$this->assertEquals($response->body, '"Owner does not own instance"');

		// ======= SUCCESSFUL REQUEST ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('GET')
			->set_post('inst_id', $instance->id)
			->set_post('owner_id', $student_id)
			->execute()
			->response();

		$output = json_decode($response->body);

		$this->assertTrue($output);
	}
}