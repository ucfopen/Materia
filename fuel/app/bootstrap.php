<?php
// Bootstrap the framework DO NOT edit this
require COREPATH.'bootstrap.php';

// DOCROOT doesn't always point at the public dir, this does
define('PUBPATH', realpath(__DIR__.DS.'..'.DS.'..'.DS.'public').DS );
define('STATICPATH', realpath(PUBPATH.DS.'..'.DS.'static').DS );

\Autoloader::add_classes([
	// Add classes you want to override here
	// Example: 'View' => APPPATH.'classes/view.php',
]);
// PHPUnit 6 introduced a breaking change that
// removed PHPUnit_Framework_TestCase as a base class,
// and replaced it with \PHPUnit\Framework\TestCase
class_alias('\PHPUnit\Framework\TestCase', '\PHPUnit_Framework_TestCase');
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

// Initialize the framework with the config file.
\Fuel::init('config.php');
