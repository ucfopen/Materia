<?php

return [
		'driver' => 'memcached',
		// specific configuration settings for memcached based sessions
		'memcached' => [
				'cookie_name' => 'fuelmid',
				'servers' => [
						'default' => [
						'host' => 'localhost',
						'port' => 11211,
						'weight' => 100
					]
				]
		],
		'expiration_time' => 21600,
];
