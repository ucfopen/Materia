<?php
return [
	'debug_engines' => false,
	'send_emails' => false,

	/*
	* build routes for static urls to use http://mymateria.com:8008/
	*/
	'urls' => [
		'static'             => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		'engines'            => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')), // engine swf locations
	],

	// add some default users for easy development
	'default_users' => [
		[
			'name'       => '~admin',
			'first_name' => 'Materia',
			'last_name'  => 'Admin',
			'password'   => 'kogneato',
			'email'      => 'materia_admin@materia.ucf.edu',
			'roles'      => ['super_user','basic_author']
		],
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'email'      => 'author@materia.ucf.edu',
			'password'   => 'kogneato',
			'roles'      => ['basic_author']
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'email'      => 'student@materia.ucf.edu',
			'password'   => 'kogneato',
		]

	],

];
