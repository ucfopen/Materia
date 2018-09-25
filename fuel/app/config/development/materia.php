<?php
return [
	'send_emails' => false, // disable email in dev

	// append port 8008 for dev
	'urls' => [
		'static' => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()),
		'engines' => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')),
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => true,

	's3_config' => [
		's3_enabled' => true,
		'endpoint'   => 'http://fakes3:10001',
		'region'     => 'us-east-1', // aws region for bucket
		'bucket'     => 'fake_bucket', // bucket to store original user uploads
		'subdir'     => 'media', // OPTIONAL - directory to store original and resized assets
		'secret_key' => '', // aws api secret key
		'key'        => '' // aws api key
	],
];
