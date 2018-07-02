<?php

return [
	'consumers' => [
		 // the name here needs to match the LTI 'tool_consumer_info_product_family_code' paramater
		'canvas' => [
			// Security Settings CHANGE THE SECRET (or both) !!!
			'secret' => 'secret',
			'key'    => 'key'
		],
		'materia' => [
			// these display in the consumer's dialogs
			'title'                 => 'Materia Widget Assignment',
			'description'           => 'Add a Materia Widget as an assignment',

			// the platform that this lti consumer is intended to match up with
			'platform'              => 'canvas.instructure.com',

			// Choose the key value of an LTI paramater to use as our username
			// In this case the value of lis_person_sourceid may be 'dave'.  We will try to match username = 'dave'
			'remote_username'       => 'lis_person_sourcedid',

			// When looking or creating local users based on the external system, what fields do we use as an identifier?
			// remote_identifier is the name of the lti data sent
			// local_identifier is the name of the user object property that we will match the remote identifier against
			// ex: incoming lis_person_sourceid = 'dave', we'll look for Model_User::query()->where($local_identifier, Input::post($remote_identifier))
			// another option is to use email instead of sourcedid, remote = 'lis_person_contact_email_primary' and local = 'email'
			'remote_identifier'     => 'lis_person_sourcedid',
			'local_identifier'      => 'username',

			// When true, materia will accept user data from the external system.
			// This means it will create users we don't have and update their user
			// data if it changes. It will NOT update any external roles
			// (see 'use_launch_roles')
			'creates_users'         => true,

			// allow an external system to define user roles in Materia
			'use_launch_roles'      => true,

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
			'course_nav_default'    => 'disabled',
			'course_nav_enabled'    => 'true',
			'course_nav_text'       => 'Materia',
			'course_nav_visibility' => 'members',

			'tool_id'               => 'edu.ucf.materia',

			// Security Settings CHANGE THE SECRET (or both) !!!
			'secret'            => 'secret',
			'key'               => 'key',

		],
	]
];
