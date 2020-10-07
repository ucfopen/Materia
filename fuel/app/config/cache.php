<?php
return [

	/**
	 * ----------------------------------------------------------------------
	 * global settings
	 * ----------------------------------------------------------------------
	 */

	// default storage driver
	'driver'      => 'file',

	// default expiration (null = no expiration)
	'expiration'  => 18000,

	/**
	 * Default content handlers: convert values to strings to be stored
	 * You can set them per primitive type or object class like this:
	 *   - 'string_handler' 		=> 'string'
	 *   - 'array_handler'			=> 'json'
	 *   - 'Some_Object_handler'	=> 'serialize'
	 */

	/**
	 * ----------------------------------------------------------------------
	 * storage driver settings
	 * ----------------------------------------------------------------------
	 */

	// specific configuration settings for the file driver
	'file'  => [
		'path'  => '',  // if empty the default will be application/cache/
	],

	// specific configuration settings for the memcached driver
	'memcached'  => [
		'cache_id'  => 'materia',  // unique id to distinquish fuel cache items from others stored on the same server(s)
		'servers'   => [   // array of servers and portnumbers that run the memcached service
			'default' => ['host' => 'localhost', 'port' => 11211, 'weight' => 100],
		],
	],

];
