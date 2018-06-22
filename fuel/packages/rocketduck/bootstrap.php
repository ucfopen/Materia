<?php
Autoloader::add_namespace('RocketDuck', PKGPATH.'rocketDuck/classes/');

Autoloader::add_classes([
	// FUELPHP classes
	'Cache'                             => __DIR__.'/classes/fuel/core/cache.php',
	'File'                              => __DIR__.'/classes/fuel/core/file.php',
	'Log'                               => __DIR__.'/classes/fuel/core/log.php',
	'TestCase'                          => __DIR__.'/classes/fuel/core/testcase.php',

	// ROCKETDUCK classes
	'RocketDuck\\Db_Role'               => __DIR__.'/classes/db/role.php',
	'RocketDuck\\Log'                   => __DIR__.'/classes/log.php',
	'RocketDuck\\Msg'                   => __DIR__.'/classes/msg.php',
	'RocketDuck\\Perm_Acl'              => __DIR__.'/classes/perm/acl.php',
	'RocketDuck\\Perm_Manager'          => __DIR__.'/classes/perm/manager.php',
	'RocketDuck\\Perm_Role'             => __DIR__.'/classes/perm/role.php',
	'RocketDuck\\Util_Validator'        => __DIR__.'/classes/util/validator.php',
]);

Config::load('rocketduck', true);
