<?php
// Bootstrap the framework DO NOT edit this
require COREPATH.'bootstrap.php';

// DOCROOT doesn't always point at the public dir, this does
define('PUBPATH', realpath(__DIR__.DS.'..'.DS.'..'.DS.'public').DS );
define('STATICPATH', realpath(PUBPATH.DS.'..'.DS.'static').DS );
$materia_path = realpath(__DIR__.DS.'classes'.DS.'materia');
\Autoloader::add_classes([
	// Add classes you want to override here
	// Example: 'View' => APPPATH.'classes/view.php',

	// MAKE SURE OUR core overrides are here so fuel doesn't try to load them
	// before the other packages get a chance to load the overrides in
	'Fuel\\Session\\File'      => $materia_path.'/fuel/session/cache.php',
	'Cache'                    => $materia_path.'/fuel/core/cache.php',
	'Fuel\\Core\\Errorhandler' => $materia_path.'/fuel/core/errorhandler.php',
	'Log'                      => $materia_path.'/fuel/core/log.php',
	'TestCase'                 => $materia_path.'/fuel/core/testcase.php',
	'Cookie'                   => $materia_path.'/fuel/core/cookie.php'
	// TODO: build task that will resolve/populate all the classes in materia here
]);

// Register the autoloader
\Autoloader::register();


// ENVIRONMENT CONFIG
// converts .env and .env.local into $_ENV vars
$env_path = realpath(__DIR__.DS.'..'.DS.'..').DS;
$dotenv = new Symfony\Component\Dotenv\Dotenv();
$dotenv->loadEnv("{$env_path}.env", "{$env_path}.env.local");

// env vars starting with BOOL_ become true boolean
foreach ($_ENV as $key => $value) {
	if (strpos($key, 'BOOL_') === 0) {
		// allowed true values 'true'
		// everything else is false !!
		$_ENV[$key] = $value === 'true';
	}
}

/**
 * Your environment.  Can be set to any of the following:
 *
 * Fuel::DEVELOPMENT
 * Fuel::TEST
 * Fuel::STAGING
 * Fuel::PRODUCTION
 */
\Fuel::$env = \Arr::get($_SERVER, 'FUEL_ENV', \Arr::get($_ENV, 'FUEL_ENV', \Fuel::DEVELOPMENT)); // @codingStandardsIgnoreLine

\Fuel::$is_test = false;
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
\Event::register('widget_instance_delete', '\Model_Notification::on_widget_delete_event');

// A function to easily trace stuff to the log
function trace($arg, $force=0)
{
	logger(Fuel::L_DEBUG, print_r($arg, true));
}
