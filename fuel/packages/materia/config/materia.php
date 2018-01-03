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
	*  URLS throughout the system
	*
	*/
	'urls' => [
		'root'               => \Uri::create(''), // root directory http:://siteurl.com/
		'media'              => \Uri::create('assets/uploads/'), // where the media is stored http:://siteurl.com/assets/upload/
		'play'               => \Uri::create('play/'), // game play  urls http://siteurl.com/play/3443
		'embed'              => \Uri::create('embed/'), // game embed urls http://siteurl.com/embed/3434
		'preview'            => \Uri::create('preview/'), // game preview urls http://siteurl.com/preview/3443
		'static'             => \Uri::create(), // allows you to host another domain for static assets http://static.siteurl.com/
		'engines'            => \Uri::create('widget/'), // engine swf locations
	],

	/*
	*  Directories of varous assets
	*/
	'dirs' => [
		'media'   => realpath(PKGPATH.'materia/media').DS, // where the uploaded assets are kept
		'engines' => realpath(PUBPATH.'widget').DS,
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

	/*
	* To view detailed documentation on asset uploads using Amazon S3, visit:
	* http://ucfcdl.github.io/Materia/develop/understanding-media-uploads
	*
	* To use fakes3, use the following config:
	* ========================================
	* > 's3_enabled'      => true
	* > 'upload_url'      => 'dockerIP:10001'
	* > 'uploads_bucket'  => 'fakes3_uploads'
	* > 'verified_bucket' => 'fakes3_assets'
	* > 'subdir'          => 'media'
	* > 'secret_key'      => 'secret'
	* > 'AWSAccessKeyId'  => 'id'
	* > 'expire_in'       => 100
	*/
	's3_config' => [
		's3_enabled'      => false,
		'upload_url'      => 's3.amazonaws.com', // only include domain and, if necessary, the port
		'uploads_bucket'  => '', // bucket to store original user uploads
		'verified_bucket' => '', // OPTIONAL - bucket to store user uploads that are manipulated and verified by Materia
		'subdir'          => 'media', // OPTIONAL - directory to store original and resized assets
		'secret_key'      => '',
		'AWSAccessKeyId'  => '',
		'expire_in'       => 100 // temporary key expiration time
	],
];
