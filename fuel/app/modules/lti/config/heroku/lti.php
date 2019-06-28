<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	'tool_consumer_instance_guid' => 'materia.YOURSCHOOL.edu',

	'consumers' => [
		'canvas' => [
			'remote_identifier' => $_ENV['LTI_USERNAME_PARAM'],
			'secret'            => $_ENV['LTI_SECRET'],
			'key'               => $_ENV['LTI_KEY'],
		],
	]
];
