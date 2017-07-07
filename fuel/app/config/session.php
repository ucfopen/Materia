<?php

return [
		'driver' => 'file',
		// specific configuration settings for memcached based sessions
		'memcached' => [
			'cookie_name' => 'fuelmid',
		],
		'expiration_time' => 21600,
];
