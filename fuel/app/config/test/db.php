<?php
/**
 * The test database settings. These get merged with the global settings.
 *
 * This environment is primarily used by unit tests, to run on a controlled environment.
 */

return array(
	'default' => array(
		'type'        => 'pdo',
		'connection'  => array(
			'dsn'        => 'mysql:host=192.168.33.33;dbname=fuel_test',
			'username'   => 'root',
			'password'   => 'root'
		),
		'table_prefix' => '',
	),
);
