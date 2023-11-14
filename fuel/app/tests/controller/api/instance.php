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
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Requires an inst_id parameter!');

		// ======= NO INST ID FOUND ========
		$response = Request::forge('/api/instance/history')
			->set_method('GET')
			->set_get('inst_id', 555)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Instance not found');

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
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Requires an inst_id parameter');

		// ======= NO OWNER ID PROVIDED ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_json('inst_id', 555)
			->execute()
			->response();

		$this->assertEquals($response->status, 401);
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Requires an owner_id parameter');

		// == Now we're an author
		$this->_as_author();

		// == Make a widget instance
		$widget = $this->make_disposable_widget();
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);
		$instance = Api_V1::widget_instance_new($widget->id, $title, $qset, false);
		$author_id = \Model_User::find_current_id();

		// ======= NO INST ID FOUND ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_json('inst_id', 555)
			->set_json('owner_id', $author_id)
			->execute()
			->response();

		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Instance not found');
		$this->assertEquals($response->status, 404);

		// ======= NO OWNER ID FOUND ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_json('inst_id', $instance->id)
			->set_json('owner_id', 111)
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Owner not found');

		// ======= OWNER DOES NOT OWN INSTANCE =========
		// Switch users
		$this->_as_student();

		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_json('inst_id', $instance->id)
			->set_json('owner_id', \Model_User::find_current_id())
			->execute()
			->response();

		$this->assertEquals($response->status, 404);
		$body = json_decode($response->body);
		$this->assertEquals($body->msg, 'Owner does not own instance');

		// ======= SUCCESSFUL REQUEST ========
		$response = Request::forge('/api/instance/request_access')
			->set_method('POST')
			->set_json('inst_id', $instance->id)
			->set_json('owner_id', $author_id)
			->execute()
			->response();

		// TODO: Test is_valid_hash

		$this->assertEquals($response->body, 'true');
		$this->assertEquals($response->status, 200);
	}
}