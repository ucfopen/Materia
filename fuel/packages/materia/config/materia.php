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
		substr(str_replace(['http://','https://'], 'static.', \Uri::base()), 0, -1)
	],
	/*
	*  Name of the sestem
	*  Messages sent out will use this name to refer to the system
	*/
	'name' => 'Materia',

	/*
	*  Enable/Disable encryption of question and answer data
	*  Encryption uses an event drivin architecture and can use custom encryption methods
	*/
	'security' => [

		'encrypt_qsets' => true,
		'encrypt_answers' => true,
	],

	/*
	*  URLS throughout the system
	*
	*/
	'urls' => [
		'root'               => \Uri::create(''), // root directory http:://siteurl.com/
		'media'              => \Uri::create('assets/uploads/'), // where the media is stored http:://siteurl.com/assets/upload/
		'play'               => \Uri::create('play/'), // game play  urls http://siteurl.com/play/3443
		'embed'              => \Uri::create('embed/'), // game embed urls http://siteurl.com/embed/3434
		'preview'            => \Uri::create('preview/'), // game preview urls http://siteurl.com/preview/3443
		'static'             => str_replace('//', '//static.', \Uri::create()), // http://static.siteurl.com/
		'engines'            => str_replace('//', '//static.', \Uri::create('widget/')), // engine swf locations
		'static_crossdomain' => str_replace('//', '//static.', \Uri::create('')), // crossdomain checks 
	],

	/*
	*  Directories of varous assets
	*/
	'dirs' => [
		'media'   => PKGPATH.'materia/media/', // where the uploaded assets are kept
		'logs'    => PKGPATH.'materia/logs', // profile data is written here
		'static'  => APPPATH.'../../static/', // profile data is written here
		'engines' => APPPATH.'../../static/widget/',
	],

	// Default media quota in bytes
	'media_quota' => 5000,

	'no_media_preview' => PUBPATH.'assets/img/no-preview.jpg',

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
		[
			'name'       => '~admin',
			'first_name' => 'Materia',
			'last_name'  => 'Admin',
			'email'      => 'fake@fake.com',
			'roles'      => ['super_user','basic_author']
		],
	],

	's3_config' => [

		'bucket' => 'default_bucket',
		'key' => 'secret_key',
		'expire_in' => 60
	]

];
