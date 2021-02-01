<?php

return [

	// Settings for this particular install
	// Change the tool_consumer_instance_guid to something unique to your install!
	'tool_consumer_info_version'             => '1',
	'launch_presentation_return_url'         => \Uri::create('lti/return'),
	'tool_consumer_info_product_family_code' => 'materia',
	'tool_consumer_instance_guid'            => $_ENV['LTI_GUID'] ?? 'ucfopen.github.io',
	'graceful_fallback_to_default'           => $_ENV['BOOL_LTI_GRACEFUL_CONFIG_FALLBACK'] ?? true,
	'log_for_debug'                          => $_ENV['BOOL_LTI_LOG_FOR_DEBUGGING'] ?? false,

	'consumers' => [
		// The array key here is matched to 'tool_consumer_info_product_family_code' in lti launches
		// if there is no specific match, 'default' is used as a fallback
		// NOTE that custom consumers do not merge with default
		// you need to re-define every key for each consumer
		'default' => [
			// these display in the consumer's dialogs
			'title'                 => 'Materia Widget Assignment',
			'description'           => 'Add a Materia Widget as an assignment',

			// the platform that this lti consumer is intended to match up with
			'platform'              => 'canvas.instructure.com',

			// Choose the key value of an LTI paramater to use as our username
			// In this case the value of lis_person_sourceid may be 'dave'.  We will try to match username = 'dave'
			'remote_username'       => $_ENV['LTI_REMOTE_USERNAME'] ?? 'lis_person_sourcedid',

			// When looking or creating local users based on the external system, what fields do we use as an identifier?
			// remote_identifier is the name of the lti data sent
			// local_identifier is the name of the user object property that we will match the remote identifier against
			// ex: incoming lis_person_sourceid = 'dave', we'll look for Model_User::query()->where($local_identifier, Input::post($remote_identifier))
			// another option is to use email instead of sourcedid, remote = 'lis_person_contact_email_primary' and local = 'email'
			'remote_identifier'     => $_ENV['LTI_REMOTE_IDENTIFIER'] ?? 'lis_person_sourcedid',
			'local_identifier'      => 'username',

			// When true, materia will accept user data from the external system.
			// This means it will create users we don't have and update their user
			// data if it changes. It will NOT update any external roles
			// (see 'use_launch_roles')
			'creates_users'         => $_ENV['BOOL_LTI_CREATE_USERS'] ?? true,

			// allow an external system to define user roles in Materia
			'use_launch_roles'      => $_ENV['BOOL_LTI_USE_LAUNCH_ROLES'] ?? true,

			// which auth driver will do the final work authenticating this user
			'auth_driver'           => 'LtiAuth',

			// Should we bother saving the assocation of the chosen widget to the resource
			// most LTI consumers do not actually know which widget they are requesting
			// however materia allows the LTI consumer to send and optional message that can request a specific widget
			'save_assoc'            => true,

			// How many seconds should the oauth token be valid since created
			'timeout'               => 3600,

			// Define the privacy level this integration to the consumer
			// public
			'privacy'               => 'public',

			// Define aspects of the course navigation link
			// such as whether it is available at all, who can see it, and what text it displays
			'course_nav_default'    => ($_ENV['BOOL_LTI_COURSE_NAV_DEFAULT'] ?? false) ? 'enabled' : 'disabled',
			'course_nav_enabled'    => 'true',
			'course_nav_text'       => 'Materia',
			'course_nav_visibility' => 'members',

			'tool_id'               => $_ENV['LTI_TOOL_ID'] ?? 'io.github.ucfopen',

			// Canvas launches with `ext_outcome_data_values_accepted=text,url`
			// this flag upgrades `url` support to `ltiLaunchUrl`
			// I believe this is a custom Canvas convention.
			// Disabled if the LTI consumer doesn't handle upgrading url to ltiLaunchUrl
			'upgrade_to_launch_url' => true,

			// Security Settings CHANGE SECRET AT LEAST!!!
			'secret'                => $_ENV['LTI_SECRET'],
			'key'                   => $_ENV['LTI_KEY'],

		],

		// Example Obojobo assignment integration
		/*
		'obojobo' => [
			'title'                 => 'Materia Widget Assignment',
			'description'           => 'Add a Materia Widget to your Learning Module',
			'platform'              => 'obojobo.ucf.edu',
			'remote_username'       => 'lis_person_sourcedid',
			'remote_identifier'     => 'lis_person_sourcedid',
			'local_identifier'      => 'username',
			'creates_users'         => true,
			'use_launch_roles'      => true,
			'auth_driver'           => 'Materiaauth',
			'save_assoc'            => false,
			'timeout'               => 3600,
			'privacy'               => 'public',
			'course_nav_default'    => 'enabled'
			'course_nav_enabled'    => 'true',
			'course_nav_text'       => 'Materia',
			'course_nav_visibility' => 'members',
			'tool_id'               => 'io.github.ucfopen',
			'upgrade_to_launch_url' => true,
			'secret'                => 'secret',
			'key'                   => 'key',
		],
		*/
	]
];
