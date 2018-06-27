<?php
return [
	'send_emails' => false, // disable email in dev

	// append port 8008 for dev
	'urls' => [
		'static' => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()),
		'engines'  => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')),
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => true,

	// turn off s3 media by default
	's3_config' => [ 's3_enabled' => false],
];
