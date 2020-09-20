<?php

namespace Lti;

class LtiLaunch
{
	protected static $launch;
	protected static $config;

	public static function from_request()
	{
		if (isset(static::$launch)) return static::$launch;
		if ( ! \Input::param('lti_message_type')) return null;

		$config = static::config();

		// these are configurable to let username and user_id come from custom launch variables
		$remote_id_field   = $config['remote_identifier'] ?? 'username';
		$remote_user_field = $config['remote_username'] ?? 'user_id';

		// trim all the roles
		$roles = explode(',', \Input::param('roles'));
		$roles = array_map( function($role) { return trim($role); }, $roles); // @codingStandardsIgnoreLine

		$vars = (object) [
			'message_type'   => trim(\Input::param('lti_message_type', '')),
			'source_id'      => trim(\Input::param('lis_result_sourcedid', false)), // the unique id for this course&context&user&launch used for returning scores
			'service_url'    => trim(\Input::param('lis_outcome_service_url', false)), // where to send score data back to, can be blank if not supported
			'resource_id'    => trim(\Input::param('resource_link_id', false)), // unique placement of this tool in the consumer
			'context_id'     => trim(\Input::param('context_id', false)),
			'context_title'  => trim(\Input::param('context_title', false)),
			'consumer_id'    => trim(\Input::param('tool_consumer_instance_guid', false)), // unique install id of this tool
			'consumer'       => trim(\Input::param('tool_consumer_info_product_family_code', false)),
			'email'          => trim(\Input::param('lis_person_contact_email_primary')),
			'last'           => trim(\Input::param('lis_person_name_family', '')),
			'first'          => trim(\Input::param('lis_person_name_given', '')),
			'fullname'       => trim(\Input::param('lis_person_name_full', '')),
			'outcome_ext'    => trim(\Input::param('ext_outcome_data_values_accepted'), ''),
			'roles'          => $roles,
			'remote_id'      => trim(\Input::param($remote_id_field)),
			'username'       => trim(\Input::param($remote_user_field)),
		];

		static::$launch = $vars;

		if (\Config::get('lti::lti.log_for_debug', false))
		{
			\Materia\Log::profile(['raw-launch-data', print_r(\Input::param(), true)], 'lti-launch');
			\Materia\Log::profile(['LtiLaunch-object', print_r(static::$launch, true)], 'lti-launch');
		}

		return static::$launch;
	}

	public static function config()
	{
		if ( ! empty(static::$config))
		{
			return static::$config;
		}

		// determine which config to use
		$consumer       = trim(\Input::param('tool_consumer_info_product_family_code', null));
		$configs        = \Config::get('lti::lti.consumers');
		$allow_fallback = \Config::get('lti::lti.graceful_fallback_to_default', true);
		$default        = $allow_fallback ? $configs['default'] : null;
		static::$config = $configs[$consumer] ?? $default ?? null;

		if (empty(static::$config))
		{
			\LOG::error("LTI Launch for {$consumer} consumer but no matching or default lti config found.");
			throw new HttpServerErrorException;
		}

		return static::$config;
	}

	public static function reset()
	{
		static::$launch = null;
		static::$config = null;
	}

}
