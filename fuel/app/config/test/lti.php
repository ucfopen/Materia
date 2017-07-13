<?php

return [

	// Settings for this particular install
	// Change the tool_consumer_instance_guid to something unique to your install!
	'tool_consumer_instance_guid'            => '8a77fd558b1784e4db604cde70fbece7test.materia.edu',
	'tool_consumer_info_version'             => '1',
	'launch_presentation_return_url'         => \Uri::create('lti/return'),
	'tool_consumer_info_product_family_code' => 'materia',

	'consumers' => [

		'materia-test' => [
			'title'             => 'Materia Widget Assignment',
			'description'       => 'Add a Materia Widget to your Learning Module',
			'platform'          => 'materia.ucf.edu',
			'remote_username'   => 'lis_person_sourcedid',
			'remote_identifier' => 'lis_person_sourcedid',
			'local_identifier'  => 'username',
			'creates_users'     => true,
			'use_launch_roles'  => true,
			'auth_driver'       => 'Materiaauth',
			'save_assoc'        => true,
			'timeout'           => 3600,
			'privacy'           => 'public',
			'secret'            => 'secret',
			'key'               => 'key',
		],
	]
];
