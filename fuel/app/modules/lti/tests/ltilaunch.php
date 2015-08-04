<?php
/**
 * @group App
 * @group Module
 * @group Lti
 */
class Test_LtiLaunch extends \Test_Basetest
{
	public function test_get_widget_from_request()
	{
		$get_widget_from_request = static::get_protected_method('\Lti\LtiEvents', 'get_widget_from_request');

		// Retreive from database via resource_link_id
		$resource_id = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars($resource_id);
		$launch->inst_id = 'tgwfr';
		$this->create_test_lti_association($launch);

		$this->reset_input();
		$_POST['resource_link_id'] = $resource_id;
		$this->assertEquals('tgwfr', $get_widget_from_request->invoke(null));

		// Retrieve from custom_widget_instance_id
		$this->reset_input();
		$_POST['custom_widget_instance_id'] = 'cwii0';
		$this->assertEquals('cwii0', $get_widget_from_request->invoke(null));

		// Retrieve from widget
		$this->reset_input();
		$_GET['widget'] = 'widge';
		$this->assertEquals('widge', $get_widget_from_request->invoke(null));
	}

	public function test_from_request()
	{
		$this->create_testing_post('test-resource', 'user', ['Student']);
		$launch = \Lti\LtiLaunch::from_request();

		// $this->assertEquals($launch->remote_id, 'user');
		$this->assertEquals('test-resource', $launch->resource_id);
		$this->assertSame($launch->roles, ['Student']);
	}

	public function test_find_assoc_from_resource_id()
	{
		$find_assoc_from_resource_id = static::get_protected_method('\Lti\LtiEvents', 'find_assoc_from_resource_id');

		$resource_id = $this->get_uniq_string();
		$launch = $this->create_testing_launch_vars($resource_id);
		$this->create_test_lti_association($launch);

		$assoc = $find_assoc_from_resource_id->invoke(null, $resource_id);

		$this->assertEquals($assoc->resource_link, $resource_id);
	}
}
