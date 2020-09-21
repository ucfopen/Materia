<?php

$assets_exist = file_exists(DOCROOT."dist/js/my-widgets.js");
// convert current url to https://whatever:8008/ for simulated pass through cdn
$simulated_cdn_url = preg_replace('/(https:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create());
return [
	'send_emails' => false, // disable email in dev

	'urls' => [
		// append port 8008 for dev
		// simulates loading from a pass-through cdn
		'static'  => $simulated_cdn_url,
		'engines' => $simulated_cdn_url.'widget/',
		'js_css'  => $assets_exist ? $simulated_cdn_url.'dist/' : '//127.0.0.1:8080/dist/',
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
