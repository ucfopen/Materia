<?php

return [
	'active' => 'default',

	'default' => [
		'connection'  => [
			'dsn'       => 'mysql:host=localhost;dbname=materia',
			'username'  => 'materia',
			'password'  => 'SECRET MATERIA DB USER PASSWORD',
		],
		'type'         => 'pdo',
		'identifier'   => '`',
		'table_prefix' => '',
		'charset'      => 'utf8',
		'caching'      => false,
		'profiling'    => false,
	],
];
