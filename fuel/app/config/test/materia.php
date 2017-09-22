<?php
return [
	'send_emails' => false,
	'dirs' => [
		'media'   => PKGPATH.'materia/media/', // where the uploaded assets are kept
		'logs'    => PKGPATH.'materia/logs', // profile data is written here
		'engines' => PUBPATH.'widget/test/',
	],

	// build routes for static urls to use http://mymateria.com:8008
	'urls' => [
		'static'             => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		'engines'            => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')), // engine swf locations
	],
	'default_users' => [
		// This user is used by the server to do management tasks, do not alter
		[
			'name'       => '~materia_system_only',
			'first_name' => 'Materia',
			'last_name'  => 'System',
			'password'   => 'kogneato',
			'email'      => 'materia_system@materia.ucf.edu',
			'roles'      => ['super_user','basic_author']
		],
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'password'   => 'kogneato',
			'email'      => 'author@materia.ucf.edu',
			'roles'      => ['basic_author']
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'password'   => 'kogneato',
			'email'      => 'student@materia.ucf.edu',
		]
	],
];
