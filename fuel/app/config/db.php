<?php

return [
	'active' => 'default',

	'default' => [
		'type'        => 'pdo',
		'connection'  => [
			'persistent' => false,
		],
		'identifier'   => '`',
		'table_prefix' => '',
		'charset'      => 'utf8',
		'caching'      => false,
		'profiling'    => false,
	],
];