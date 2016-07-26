<?php
return [
	/*
	*  Enable/Disable encryption of question and answer data
	*  Encryption uses an event drivin architecture and can use custom encryption methods
	*/
	'security' => [

		'encrypt_qsets' => false,
		'encrypt_answers' => false,
	],

	'debug_engines' => false,
	'send_emails' => false,

	/*
	*  URLS throughout the system
	*
	*/
	'urls' => [
		// 'root'    => \Uri::create(''), // root directory http:://siteurl.com/
		// 'media'   => \Uri::create('assets/uploads/'), // where the media is stored http:://siteurl.com/assets/upload/
		// 'play'    => \Uri::create('play/'), // game play  urls http://siteurl.com/play/3443
		// 'embed'   => \Uri::create('embed/'), // game embed urls http://siteurl.com/embed/3434
		// 'preview' => \Uri::create('preview/'), // game preview urls http://siteurl.com/preview/3443
		'static'             => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		'engines'            => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')), // engine swf locations
		'static_crossdomain' => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		// 'static'             => \Uri::create('/static/'), // http://static.siteurl.com/
		// 'engines'            => \Uri::create('/static/widget/'), // engine swf locations
		// 'static_crossdomain' => \Uri::create(), // http://static.siteurl.com/
	],

	'default_users' => [
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'email'      => 'author@materia.com',
			'password'   => 'kogneato',
			'roles'      => ['basic_author']
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'email'      => 'student@materia.com',
			'password'   => 'kogneato',
		]
	],

	's3_config' => [

		'bucket' => 'default_bucket',
		'secret_key' => 'secret_key',
		'expire_in' => 60
	]

];
