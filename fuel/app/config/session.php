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
		'cookie_same_site' => (
			// Assume true if 'true', unset, or any other input. Only assume false if specifically set to 'false'
			(filter_var($_ENV['IS_SERVER_HTTPS'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true)
			? 'None' : 'Strict'
		)
];
