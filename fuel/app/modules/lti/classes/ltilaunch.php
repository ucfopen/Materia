<?php

namespace Lti;

class LtiLaunch
{
	protected static $launch;

	public static function from_request()
	{
		if (isset(static::$launch)) return static::$launch;
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

		static::$launch = $vars;

		return static::$launch;
	}

}
