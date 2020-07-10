<?php

return [
		'driver' => $_ENV['SESSION_DRIVER'] ?? 'file',
		// specific configuration settings for memcached based sessions
		'memcached' => [
			'cookie_name' => 'fuelmid',
			'servers' => [
				'default' => [
					'host' => $_ENV['MEMCACHED_HOST'] ?? 'localhost',
					'port' => $_ENV['MEMCACHED_PORT'] ?? 11211
				]
			]
		],
		'expiration_time' => $_ENV['SESSION_EXPIRATION'] ?? null,
];
