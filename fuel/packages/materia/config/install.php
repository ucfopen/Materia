<?php

return [
	// what permission to set on the writable_paths
	'writable_file_perm' => 0777,

	// which paths should have the above perm applied to them
	'writable_paths' => [
		APPPATH.'cache',
		APPPATH.'logs',
		APPPATH.'tmp',
		APPPATH.'config',
		// custom materia stuff
		PKGPATH.'materia/media',
		PKGPATH.'materia/media/large',
		PKGPATH.'materia/media/thumbnail',
		PKGPATH.'materia/media/uploads',
		PKGPATH.'materia/vendor/widget',
		PKGPATH.'materia/vendor/widget/score_module',
		PKGPATH.'materia/vendor/widget/test',
		// widget directories
		\Config::get('materia.dirs.engines'),
		\Config::get('materia.dirs.engines').'test',
	],

	// list of default configs to copy into the requested environment
	'essential_configs' => [
		// 'auth',
		// 'cache',
		// 'file',
		// 'config',
		// 'db',
		// 'lti',
		// 'session',
	],

	// collection of configuration variables that need to be set in a typical install
	// key = the config value in dot notation
	// value = the default value, if it's null, it'll use the value from the config as a default
	'setup_wizard_config_options' => [
		'file.enable_mod_xsendfile' => [
			'options' => ['true', 'false'],
			'default' => true,
			'type' => FILTER_VALIDATE_BOOLEAN,
			'description' => 'Using Apache? Enable X-Sendfile fast file downloads?',
		],
		'file.enable_x_accel' => [
			'options' => ['true', 'false'],
			'default' => true,
			'type' => FILTER_VALIDATE_BOOLEAN,
			'description' => 'Using NGINX? Enable X-Accell fast file downloads?',
			'depends_on_value_match' => ['file.enable_mod_xsendfile' => false],
		],
		'config.enable_uploader' => [
			'options' => ['true', 'false'],
			'default' => true,
			'type' => FILTER_VALIDATE_BOOLEAN,
			'description' => 'Allow the admin user to upload widget packages.',
		],
		'cache.driver' => [
			'options' => ['memcached', 'file'],
			'description' => 'Choose a cache driver for FuelPhp (https://fuelphp.com/docs/classes/cache/config.html).',
		],
		'cache.file.path' => [
			'default' => APPPATH.'tmp',
			'depends_on_value_match' => ['cache.driver' => 'file'],
		],
		'cache.memcached.servers.default.host' => [
			'default' => 'localhost',
			'depends_on_value_match' => ['cache.driver' => 'memcached'],
		],
		'cache.memcached.servers.default.port' => [
			'type' => FILTER_VALIDATE_INT,
			'default' => '11211',
			'depends_on_value_match' => ['cache.driver' => 'memcached'],
		],
		'session.driver' => [
			'options' => ['memcached', 'file'],
			'description' => 'Choose a session driver for FuelPHP (https://fuelphp.com/docs/classes/session/config.html).',
		],
		'session.file.path' => [
			'default' => APPPATH.'tmp',
			'depends_on_value_match' => ['session.driver' => 'file'],
		],
		'session.memcached.servers.default.host' => [
			'default' => 'localhost',
			'depends_on_value_match' => ['session.driver' => 'memcached'],
		],
		'session.memcached.servers.default.port' => [
			'type' => FILTER_VALIDATE_INT,
			'default' => '11211',
			'depends_on_value_match' => ['session.driver' => 'memcached'],
		],
		'db.default.connection.dsn' => [
			'default' => 'mysql:host=localhost;port=3306;dbname=materia',
			'description' => 'PDO connection string (see http://php.net/manual/en/ref.pdo-mysql.connection.php)',
		],
		'db.default.connection.username' => [
			'default' => 'materia',
			'description' => 'Database user name?',
		],
		'db.default.connection.password' => [
			'generate_random_key' => true,
			'description' => 'Database user password?',
		],
		'lti::lti.tool_consumer_instance_guid' => [
			'default' => 'materia.YOUR_INSTITUTION.edu',
			'description' => 'Unique LTI identifier for your Materia install.',
		],
		'lti::lti.consumers.canvas.remote_username' => [
			'default' => 'lis_person_sourcedid',
			'description' => 'Which LTI variable do you want to use as a username in Materia?',
		],
		'lti::lti.consumers.canvas.remote_identifier' => [
		'default' => 'lis_person_sourcedid',
			'description' => 'Which LTI variable do you want to use as a username in Materia?',
		],
		'lti::lti.consumers.canvas.course_nav_default' => [
			'options' => ['true', 'false'],
			'default' => false,
			'type' => FILTER_VALIDATE_BOOLEAN,
			'description' => 'Display Materia in Canvas navigation bar?',
		],
		'lti::lti.consumers.canvas.secret' => [
			'generate_random_key' => true,
			'description' => 'LTI Secret key for Canvas.',
		],
		'lti::lti.consumers.canvas.key' => [
			'default' => 'materia-production-lti-key',
			'description' => 'LTI Consumer Key for Canvas.',
		],
		'auth.restrict_logins_to_lti_single_sign_on' => [
			'options' => ['true', 'false'],
			'default' => true,
			'type' => FILTER_VALIDATE_BOOLEAN,
			'description' => 'Only allow users to log in via LTI single sign on from the LMS?',
		],
		'auth.salt' => [
			'generate_random_key' => true,
			'description' => 'Random string for salting internal passwords.',
		],
		'crypt.crypto_key' => [
			'generate_random_key' => true,
			'description' => 'Random private key for encyption.',
		],
		'crypt.crypto_iv' => [
			'generate_random_key' => true,
			'description' => 'Random private key for encyption (another one!).',
		],
		'crypt.crypto_hmac' => [
			'generate_random_key' => true,
			'description' => 'Random private key for encyption (AND ANOTHER ONE).',
		],
		'config.security.token_salt' => [
			'generate_random_key' => true,
			'description' => 'Salt used for session generation (and more).',
		],
	]
];
