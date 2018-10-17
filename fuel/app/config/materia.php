<?php
return [

	/*
	*  System email address
	*  All messages will be from this address
	*/
	'system_email'  => 'noReply@materia.com',
	'system_version' => 'Bahumut',

	'crossdomain' => [
		// Adds in the static subdomain to the allowed domains in crossdomain.xml
		substr(str_replace(['http://','https://'], 'static.', \Uri::base()), 0, -1),
	],
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
		'root'               => \Uri::create(''), // root directory http:://siteurl.com/
		'media'              => \Uri::create('media'), // where media is retrieved
		'media_upload'       => \Uri::create('media/upload'), // where media is uploaded
		'play'               => \Uri::create('play/'), // game play  urls http://siteurl.com/play/3443
		'embed'              => \Uri::create('embed/'), // game embed urls http://siteurl.com/embed/3434
		'preview'            => \Uri::create('preview/'), // game preview urls http://siteurl.com/preview/3443
		'static'             => \Uri::create(), // allows you to host another domain for static assets http://static.siteurl.com/
		'engines'            => \Uri::create('widget/'), // widget file locations
	],


	// Default media quota in bytes
	'media_quota' => 5000,

	'no_media_preview' => PUBPATH.'img/no-preview.jpg',

	// amount of time before a draft auto-unlocks
	'lock_timeout' => 60 * 2,

	'debug_engines' => false,

	'send_emails' => true,

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
			'roles'      => ['super_user','basic_author']
		],
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'email'      => 'author@materia.ucf.edu',
			'roles'      => ['basic_author']
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'email'      => 'student@materia.ucf.edu',
		]
	],

	/**
	* Allow browser based widget uploads by administrators
	*/
	'enable_admin_uploader' => false,

	// Asset storage configuration
	'asset_storage_driver' => 'file',

	'asset_storage' => [
		'file' => [
			'driver_class' => '\Materia\Widget_Asset_Storage_File',
			'media_dir'    => APPPATH.'media'.DS,
		],
		'db' => [
			'driver_class' => '\Materia\Widget_Asset_Storage_Db'
		],
		's3' => [
			'driver_class' => '\Materia\Widget_Asset_Storage_S3',
			'endpoint'     => false, // set to url for testing endpoint
			'region'       => 'us-east-1', // aws region for bucket
			'bucket'       => '', // bucket to store original user uploads
			'subdir'       => 'media', // OPTIONAL - directory to store original and resized assets
			'secret_key'   => '', // aws api secret key
			'key'          => '' // aws api key
		],
	]

];
