<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	'send_emails' => false,
	/**
	* Uploader is disabled on Heroku by default
	* Because we can't rely on disk storage
	* To enable installation, you'll have to
	* set up off-heroku widget storage
	* like S3 (see docs)
	*/
	'enable_admin_uploader' => false,

	'default_users' => [
		// This user is used by the server to do management tasks, do not alter
		[
			'name'       => '~materia_system_only',
			'first_name' => 'Materia',
			'last_name'  => 'System',
			'email'      => 'materia_system@materia.ucf.edu',
			'roles'      => ['super_user','basic_author'],
			'password'   => $_ENV['USER_SYSTEM_PASSWORD'],
		],
		[
			'name'       => '~author',
			'first_name' => 'Prof',
			'last_name'  => 'Author',
			'email'      => 'author@materia.ucf.edu',
			'roles'      => ['basic_author'],
			'password'   => $_ENV['USER_INSTRUCTOR_PASSWORD'],
		],
		[
			'name'       => '~student',
			'first_name' => 'John',
			'last_name'  => 'Student',
			'email'      => 'student@materia.ucf.edu',
			'password'   => $_ENV['USER_STUDENT_PASSWORD'],
		]
	],
];
