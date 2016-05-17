<?php

return [
	'driver' => 'file',
	// specific configuration settings for memcached based sessions
	'memcached' => [
		'cookie_name' => 'fuelmid', // name of the session cookie for memcached based sessions
		'servers' => [ // contains a list of available memcached servers
			'default' => [
				'host'   => 'localhost',
				'port'   => 11211,
				'weight' => 100
			]
		]
	],
	'expiration_time'	=> 21600,
];
