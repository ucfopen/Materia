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
			'dsn'        => 'mysql:host=192.168.33.33;dbname=fuel_dev',
			'username'   => 'root',
			'password'   => 'root'
		),
		'table_prefix' => '',
	)

);
