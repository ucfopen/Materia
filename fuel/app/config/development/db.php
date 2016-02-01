<?php
/**
 * Base Database Config.
 *
 * See the individual environment DB configs for specific config information.
 */

return array(

	'default' => array(
		'type'        => 'pdo',
		'connection'  => array(
			'dsn'        => 'mysql:host=mysql;dbname=materia', // update "mysql" to docker machine's IP address to allow database connections from host
			'username'   => 'materia',
			'password'   => 'odin'
		),
		'table_prefix' => '',
	)

);
