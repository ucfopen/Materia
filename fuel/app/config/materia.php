<?php
return [

	/*
	*  System email address
	*  All messages will be from this address
	*/
	'system_email'  => $_ENV['SYSTEM_EMAIL'],
	'system_version' => 'Bahumut',

	/*
	*  Name of the sestem
	*  Messages sent out will use this name to refer to the system
	*/
	'name' => 'Materia',

	/*
	*  URLS throughout the system
	*
	*/
	'urls' => [
		'root'         => \Uri::create(''), // root directory http:://siteurl.com/
		'media'        => \Uri::create('media'), // where media is retrieved
		'media_upload' => \Uri::create('media/upload'), // where media is uploaded
		'play'         => \Uri::create('play/'), // game play  urls http://siteurl.com/play/3443
		'embed'        => \Uri::create('embed/'), // game embed urls http://siteurl.com/embed/3434
		'preview'      => \Uri::create('preview/'), // game preview urls http://siteurl.com/preview/3443
		'static'       => $_ENV['URLS_STATIC'] ?? \Uri::create(), // allows you to host another domain for static assets http://static.siteurl.com/
		'engines'      => $_ENV['URLS_ENGINES'] ?? \Uri::create('widget/'), // widget file locations
	],


	// Default media quota in bytes
	'media_quota' => 5000,

	'no_media_preview' => PUBPATH.'img/no-preview.jpg',

	'heroku_admin_warning' => $_ENV['IS_HEROKU'] ?? false,

	// amount of time before a draft auto-unlocks
	'lock_timeout' => 60 * 2,

	'debug_engines' => false,

	'send_emails' => $_ENV['BOOL_SEND_EMAILS'] ?? false,

	'default_api_version' => 2,

	// location of the lang files
	'lang_path' => [
		'login' => APPPATH.DS
	],

	'default_users' => [
		// This user is used by the server to do management tasks, do not alter
		[
			'name'       => '~materia_system_only',
			'first_name' => 'Materia',
			'last_name'  => 'System',
			'email'      => 'materia_system@materia.ucf.edu',
			'roles'      => ['super_user','basic_author'],
			'password'   => $_ENV['USER_SYSTEM_PASSWORD'] ?? null,
		],
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'email'      => 'author@materia.ucf.edu',
			'roles'      => ['basic_author'],
			'password'   => $_ENV['USER_INSTRUCTOR_PASSWORD'] ?? null,
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'email'      => 'student@materia.ucf.edu',
			'password'   => $_ENV['USER_STUDENT_PASSWORD'] ?? null,
		]
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => $_ENV['BOOL_ADMIN_UPLOADER_ENABLE'] ?? true,

	'google_tracking_id' => $_ENV['GOOGLE_ANALYTICS_ID'] ?? false,

	// Asset storage configuration
	'asset_storage_driver' => $_ENV['ASSET_STORAGE_DRIVER'] ?? 'file',

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
				'endpoint'     =>$_ENV['ASSET_STORAGE_S3_ENDPOINT'] ?? false, // set to url for testing endpoint
				'region'       => $_ENV['ASSET_STORAGE_S3_REGION'] ?? 'us-east-1', // aws region for bucket
				'bucket'       => $_ENV['ASSET_STORAGE_S3_BUCKET'], // bucket to store original user uploads
				'subdir'       => $_ENV['ASSET_STORAGE_S3_BASEPATH'] ?? 'media', // OPTIONAL - directory to store original and resized assets
				'secret_key'   => $_ENV['ASSET_STORAGE_S3_SECRET'], // aws api secret key
				'key'          => $_ENV['ASSET_STORAGE_S3_KEY'] ?? 'KEY' // aws api key
			]
			: null
		),
	]

];
