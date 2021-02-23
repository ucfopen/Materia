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
}