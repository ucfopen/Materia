<?php
return [
	'debug_engines' => false,
	'send_emails' => false,

	/*
	* build routes for static urls to use http://mymateria.com:8008/
	*/
	'urls' => [
		'media'              => 'media', // where the media is stored http:://siteurl.com/assets/upload/
		'media_upload'       => 'media/upload', // where to post media uploads
		'static'             => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		'engines'            => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')), // engine swf locations
	],

	// add some default users for easy development
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
		's3_enabled'      => true,
		'upload_url'      => 'localhost:10001', // only include domain and, if necessary, the port
		'uploads_bucket'  => 'fakes3_uploads', // bucket to store original user uploads
		'verified_bucket' => 'fakes3_assets', // OPTIONAL - bucket to store user uploads that are manipulated and verified by Materia
		'subdir'          => 'media', // OPTIONAL - directory to store original and resized assets
		'secret_key'      => 'secret',
		'AWSAccessKeyId'  => 'id',
		'expire_in'       => 100 // temporary key expiration time
	],
];
