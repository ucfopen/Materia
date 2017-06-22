<?php
/**
 * Base Database Config.
 *
 * See the individual environment DB configs for specific config information.
 */

return [

	'default' => [
		'connection'  => [
			// in our docker environment, host=mysql is an alias for the ip for the mysql container
			'dsn'        => 'mysql:host=mysql;dbname=materia',
			'username'   => 'materia',
			'password'   => 'odin'
		],
	]
];
