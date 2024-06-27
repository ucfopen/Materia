<?php

// since this is the dev config - the assumption is that assets are located in public/dist. NGINX will reroute *.js and *.css requests for public/ to public/dist/
$assets_exist = file_exists(DOCROOT."dist/js/my-widgets.js");
// convert current url to https://whatever:8008/ for simulated pass through cdn
$simulated_cdn_url = preg_replace('/(https:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create());
return [
	'send_emails' => false, // disable email in dev

	'urls' => [
		// append port 8008 for dev
		// simulates loading from a pass-through cdn
		// No port is specified so 8080 is picked by default
		'static'  => $simulated_cdn_url,
		'engines' => $simulated_cdn_url.'widget/',
		'js_css'  => $assets_exist ? $simulated_cdn_url : '//127.0.0.1:8080/',
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => true,

	// Storage driver can be overridden from env here
	// s3 uses fakes3 on dev
	'asset_storage_driver' => $_ENV['ASSET_STORAGE_DRIVER'] ?? 's3',

	'asset_storage' => [
		'file' => [
			'driver_class' => '\Materia\Widget_Asset_Storage_File',
			'media_dir'    => APPPATH.'media'.DS,
		],
		'db' => [
			'driver_class' => '\Materia\Widget_Asset_Storage_Db'
		],
		's3' => (
			(($_ENV['ASSET_STORAGE_DRIVER'] ?? 'file') == 's3')
			? [
				'driver_class' => '\Materia\Widget_Asset_Storage_S3',
				'endpoint'     => $_ENV['ASSET_STORAGE_S3_ENDPOINT'] ?? 'http://fakes3:10001', // set to url for testing endpoint
				'region'       => $_ENV['ASSET_STORAGE_S3_REGION'] ?? 'us-east-1', // aws region for bucket
				'bucket'       => $_ENV['ASSET_STORAGE_S3_BUCKET'] ?? 'fake_bucket', // bucket to store original user uploads
				'subdir'       => $_ENV['ASSET_STORAGE_S3_BASEPATH'] ?? 'media', // OPTIONAL - directory to store original and resized assets
				'secret_key'   => $_ENV['AWS_SECRET_ACCESS_KEY'] ?? $_ENV['ASSET_STORAGE_S3_SECRET'] ?? 'SECRET', // aws api secret key
				'key'          => $_ENV['AWS_ACCESS_KEY_ID'] ?? $_ENV['ASSET_STORAGE_S3_KEY'] ?? 'KEY', // aws api key
				'token'		   => $_ENV['AWS_SESSION_TOKEN'] ?? 'TOKEN',	// aws session token
				'force_path_style' => $_ENV['ASSET_STORAGE_S3_FORCE_PATH_STYLE'] ?? false, // needed for fakes3
			]
			: null
		),
	]
];