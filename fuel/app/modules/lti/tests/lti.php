<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_Lti extends \Test_Basetest
{
	public function test_get_widget_from_request()
	{
		// Retreive from database via resource_link_id
		$resource_id = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars($resource_id);
		$launch->inst_id = 'tgwfr';
		$this->create_test_lti_association($launch);

		$this->reset_input();
		$_POST['resource_link_id'] = $resource_id;
		$this->assertEquals('tgwfr', \Lti\Lti::get_widget_from_request());

		// Retrieve from custom_widget_instance_id
		$this->reset_input();
		$_POST['custom_widget_instance_id'] = 'cwii0';
		$this->assertEquals('cwii0', \Lti\Lti::get_widget_from_request());

		// Retrieve from widget
		$this->reset_input();
		$_GET['widget'] = 'widge';
		$this->assertEquals('widge', \Lti\Lti::get_widget_from_request());
	}

	public function test_get_launch_from_request()
	{
		$this->create_testing_post('test-resource', 'user', ['Student']);
		$launch = \Lti\Lti::get_launch_from_request();

		// $this->assertEquals($launch->remote_id, 'user');
		$this->assertEquals('test-resource', $launch->resource_id);
		$this->assertSame($launch->roles, ['Student']);
	}

	public function test_find_assoc_from_resource_id()
	{
		$resource_id = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars($resource_id);
		$this->create_test_lti_association($launch);

		$assoc = \Lti\Lti::find_assoc_from_resource_id($resource_id);

		$this->assertEquals($assoc->resource_link, $resource_id);
	}
}
