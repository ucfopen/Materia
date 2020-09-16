<?php

return [
	'driver' => 'memcached',
	// specific configuration settings for memcached based sessions
	'memcached' => [
		'servers' => [ // contains a list of available memcached servers
			'default' => [
				'host' => 'memcached',
			]
		]
	],
];
