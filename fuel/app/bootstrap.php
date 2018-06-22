<?php
// Bootstrap the framework DO NOT edit this
require COREPATH.'bootstrap.php';

// DOCROOT doesn't always point at the public dir, this does
define('PUBPATH', realpath(__DIR__.DS.'..'.DS.'..'.DS.'public').DS );
define('STATICPATH', realpath(PUBPATH.DS.'..'.DS.'static').DS );
define('MATERIAPATH', realpath(__DIR__.DS.'classes'.DS.'materia'));
define('RDPATH', realpath(__DIR__.DS.'classes'.DS.'rocketduck'));
\Autoloader::add_classes([
	// FUELPHP classes
	'Fuel\\Core\\Errorhandler'          => MATERIAPATH.DS.'errorhandler.php',
	'Fuel\\Session\\File'               => MATERIAPATH.DS.'session'.DS.'file.php',
	'Cache'                             => RDPATH.'/fuel/core/cache.php',
	'File'                              => RDPATH.'/fuel/core/file.php',
	'Log'                               => RDPATH.'/fuel/core/log.php',
	'TestCase'                          => RDPATH.'/fuel/core/testcase.php',

	// TODO: build task that will resolve/populate all the classes in materia here
]);


// Register the autoloader
\Autoloader::register();

/**
 * Your environment.  Can be set to any of the following:
 *
 * Fuel::DEVELOPMENT
 * Fuel::TEST
 * Fuel::STAGING
 * Fuel::PRODUCTION
 */
\Fuel::$env = \Arr::get($_SERVER, 'FUEL_ENV', \Arr::get($_ENV, 'FUEL_ENV', \Fuel::DEVELOPMENT)); // @codingStandardsIgnoreLine

if(\FUEL::$env === \FUEL::TEST){
	// PHPUnit 6 introduced a breaking change that
	// removed PHPUnit_Framework_TestCase as a base class,
	// and replaced it with \PHPUnit\Framework\TestCase
	// doing this here because fuelphp core hasn't updated to phpunit 6 yet
	class_alias('\PHPUnit\Framework\TestCase', '\PHPUnit_Framework_TestCase');
}

// Initialize the framework with the config file.
\Fuel::init('config.php');

// register events after the app is initialized
// if this is placed in config/events, it'll load notification before orm gets loaded :(
\Event::register('delete_widget_event', '\Model_Notification::on_widget_delete_event');

// A function to trace stuffs to the log
function trace($arg, $force=0, $incbacklog=0)
{
	logger(Fuel::L_DEBUG, print_r($arg, true));
	return true;
}
