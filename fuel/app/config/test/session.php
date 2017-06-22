<?php

return [
	'driver' => 'memcached',
	// specific configuration settings for memcached based sessions
	'memcached' => [
		'cookie_name' => 'ftestid', // name of the session cookie for memcached based sessions
		'servers' => [ // contains a list of available memcached servers
			'default' => [
				'host'   => 'memcached',
				'port'   => 11211,
				'weight' => 100
			]
		]
	],
];
