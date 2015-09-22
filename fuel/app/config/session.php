<?php

return array(
	'driver' => 'memcached',
	// specific configuration settings for memcached based sessions
	'memcached' => array(
		'cookie_name' => 'fuelmid', // name of the session cookie for memcached based sessions
		'servers' => array( // contains a list of available memcached servers
			'default' => array(
				'host'   => '127.0.0.1',
				'port'   => 11211,
				'weight' => 100
			)
		)
	),
	'expiration_time'	=> 21600,
);
