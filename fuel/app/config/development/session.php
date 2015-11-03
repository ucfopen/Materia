<?php

return array(
	'driver' => 'file',
	// specific configuration settings for file based sessions
	'file' => array(
		'cookie_name'    => 'fuelfid',      // name of the session cookie for file based sessions
		'path'           => APPPATH.'/tmp', // path where the session files should be stored
		'gc_probability' => 5               // probability % (between 0 and 100) for garbage collection
	),
	'expiration_time' => 21600,
);
