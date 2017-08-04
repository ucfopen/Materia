<?php
/**
 * The test database settings. These get merged with the global settings.
 *
 * This environment is primarily used by unit tests, to run on a controlled environment.
 */

return [
	'default' => [
		'connection'  => [
			'dsn'        => 'mysql:host=mysql;dbname=test', // update "mysql" to docker machine's IP address to allow database connections from host
			'username'   => 'materia',
			'password'   => 'odin'
		],
	],
];
