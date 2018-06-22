<?php
// Bootstrap the framework DO NOT edit this
require COREPATH.'bootstrap.php';

// DOCROOT doesn't always point at the public dir, this does
define('PUBPATH', realpath(__DIR__.DS.'..'.DS.'..'.DS.'public').DS );
define('STATICPATH', realpath(PUBPATH.DS.'..'.DS.'static').DS );
define('MATERIAPATH', realpath(__DIR__.DS.'classes'.DS.'materia'));
define('RDPATH', realpath(__DIR__.DS.'classes'.DS.'rocketduck'));
\Autoloader::add_namespace('Materia', MATERIAPATH);
\Autoloader::add_namespace('RocketDuck', RDPATH);
\Autoloader::add_classes([
	// FUELPHP classes
	'Fuel\\Core\\Errorhandler'          => MATERIAPATH.DS.'errorhandler.php',
	'Fuel\\Session\\File'               => MATERIAPATH.DS.'session'.DS.'file.php',
	'Cache'                             => RDPATH.'/fuel/core/cache.php',
	'File'                              => RDPATH.'/fuel/core/file.php',
	'Log'                               => RDPATH.'/fuel/core/log.php',
	'TestCase'                          => RDPATH.'/fuel/core/testcase.php',

	// ROCKETDUCK classes
	// 'RocketDuck\\Db_Role'               => RDPATH.'/db/role.php',
	// 'RocketDuck\\Log'                   => RDPATH.'/log.php',
	// 'RocketDuck\\Msg'                   => RDPATH.'/msg.php',
	// 'RocketDuck\\Perm_Acl'              => RDPATH.'/perm/acl.php',
	// 'RocketDuck\\Perm_Manager'          => RDPATH.'/perm/manager.php',
	// 'RocketDuck\\Perm_Role'             => RDPATH.'/perm/role.php',
	// 'RocketDuck\\Util_Validator'        => RDPATH.'/util/validator.php',

	// 'Materia\\api'                      => MATERIAPATH.DS.'api.php',
	// 'Materia\\Api_v1'                   => MATERIAPATH.DS.'api/v1.php',
	// 'Materia\\Community_manager'        => MATERIAPATH.DS.'community/manager.php',
	// 'Materia\\message'                  => MATERIAPATH.DS.'message.php',
	// 'Materia\\notification'             => MATERIAPATH.DS.'notification.php',
	// 'Materia\\Notification_manager'     => MATERIAPATH.DS.'notification/manager.php',
	// 'Materia\\perm'                     => MATERIAPATH.DS.'perm.php',
	// 'Materia\\Perm_manager'             => MATERIAPATH.DS.'perm/manager.php',
	// 'Materia\\Score_manager'            => MATERIAPATH.DS.'score/manager.php',
	// 'Materia\\Score_record'             => MATERIAPATH.DS.'score/record.php',
	// 'Materia\\Session_activity'         => MATERIAPATH.DS.'session/activity.php',
	// 'Materia\\Session_log'              => MATERIAPATH.DS.'session/log.php',
	// 'Materia\\Session_logger'           => MATERIAPATH.DS.'session/logger.php',
	// 'Materia\\Session_play'             => MATERIAPATH.DS.'session/play.php',
	// 'Materia\\Storage_manager'          => MATERIAPATH.DS.'storage/manager.php',
	// 'Materia\\User_meta'                => MATERIAPATH.DS.'user/meta.php',
	// 'Materia\\utils'                    => MATERIAPATH.DS.'utils.php',
	// 'Materia\\widget'                   => MATERIAPATH.DS.'widget.php',
	// 'Materia\\Widget_asset'             => MATERIAPATH.DS.'widget/asset.php',
	// 'Materia\\Widget_Asset_manager'     => MATERIAPATH.DS.'widget/asset/manager.php',
	// 'Materia\\Widget_instance'          => MATERIAPATH.DS.'widget/instance.php',
	// 'Materia\\Widget_Instance_hash'     => MATERIAPATH.DS.'widget/instance/hash.php',
	// 'Materia\\Widget_Instance_manager'  => MATERIAPATH.DS.'widget/instance/manager.php',
	// 'Materia\\Widget_manager'           => MATERIAPATH.DS.'widget/manager.php',
	// 'Materia\\Widget_question'          => MATERIAPATH.DS.'widget/question.php',
	// 'Materia\\Widget_Question_answer'   => MATERIAPATH.DS.'widget/question/answer.php',
	// 'Materia\\Widget_Question_manager'  => MATERIAPATH.DS.'widget/question/manager.php',
	// 'Materia\\Widget_Question_Type_mc'  => MATERIAPATH.DS.'widget/question/type/mc.php',
	// 'Materia\\Widget_Question_Type_qa'  => MATERIAPATH.DS.'widget/question/type/qa.php',
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
	// class_alias('\PHPUnit\Framework\TestCase', '\PHPUnit_Framework_TestCase');
}

// Initialize the framework with the config file.
\Fuel::init('config.php');

// register events after the app is initialized
\Event::register('delete_widget_event', '\Model_Notification::on_widget_delete_event');

// A function to trace stuffs to the log
function trace($arg, $force=0, $incbacklog=0)
{
	logger(Fuel::L_DEBUG, print_r($arg, true));
	return true;
}
