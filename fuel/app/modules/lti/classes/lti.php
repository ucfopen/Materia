<?php

namespace Lti;
use \RocketDuck\Util_Validator;

class Lti
{
	protected static $inst_id;

	// grabs the widget instance id from the post/get variables
	// @return FALSE or a valid instance id
	public static function get_widget_from_request()
	{
		if ( isset(static::$inst_id)) return static::$inst_id;

		$request_widget         = \Input::param('widget', false);
		$request_custom_inst_id = \Input::param('custom_widget_instance_id', false);
		$request_resource_id    = \Input::param('resource_link_id', false);

		// return one of the values from POST/GET, if valid
		if (Util_Validator::is_valid_hash($request_widget)) return $request_widget;
		if (Util_Validator::is_valid_hash($request_custom_inst_id)) return $request_custom_inst_id;

		// return if we can find its association in the database
		$assoc = static::find_assoc_from_resource_id($request_resource_id);
		if ( $assoc && Util_Validator::is_valid_hash($assoc->item_id)) return $assoc->item_id;

		return false;
	}

	public static function get_launch_from_request()
	{
		// these are configurable to let username and user_id come from custom launch variables
		$consumer          = trim(\Input::param('tool_consumer_info_product_family_code', false));
		$remote_id_field   = \Config::get("lti::lti.consumers.{$consumer}.remote_identifier", 'username');
		$remote_user_field = \Config::get("lti::lti.consumers.{$consumer}.remote_username", 'user_id');

		// trim all the roles
		$roles = explode(',', \Input::param('roles'));
		$roles = array_map( function($role) { return trim($role); }, $roles);

		$vars = (object) [
			'source_id'      => trim(\Input::param('lis_result_sourcedid', false)), // the unique id for this course&context&user&launch used for returning scores
			'service_url'    => trim(\Input::param('lis_outcome_service_url', false)), // where to send score data back to, can be blank if not supported
			'resource_id'    => trim(\Input::param('resource_link_id', false)), // unique placement of this tool in the consumer
			'context_id'     => trim(\Input::param('context_id', false)),
			'context_title'  => trim(\Input::param('context_title', false)),
			'consumer_id'    => trim(\Input::param('tool_consumer_instance_guid', false)), // unique install id of this tool
			'consumer'       => $consumer,
			'email'          => trim(\Input::param('lis_person_contact_email_primary')),
			'last'           => trim(\Input::param('lis_person_name_family', '')),
			'first'          => trim(\Input::param('lis_person_name_given', '')),
			'fullname'       => trim(\Input::param('lis_person_name_full', '')),
			'roles'          => $roles,
			'remote_id'      => trim(\Input::param($remote_id_field)),
			'username'       => trim(\Input::param($remote_user_field))
		];

		return $vars;
	}

	/**
	 * Gets the Model_Lti associated with a resource id
	 * @param string An LTI resource id
	 * @return Model_Lti or NULL if none found
	 */
	public static function find_assoc_from_resource_id($resource_id)
	{
		return Model_Lti::query()->where('resource_link', $resource_id)->get_one();
	}
}
