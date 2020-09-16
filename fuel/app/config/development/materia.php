<?php
return [
	'send_emails' => false, // disable email in dev

	// append port 8008 for dev
	'urls' => [
		'static' => preg_replace('/(https:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()),
		'engines' => preg_replace('/(https:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')),
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => true,

	'asset_storage_driver' => 's3',

	'asset_storage' => [
		's3' => [
			'endpoint'   => 'http://fakes3:10001',
			'bucket'     => 'fake_bucket', // bucket to store original user uploads
		],
	]
];
