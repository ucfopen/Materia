<?php
Autoloader::add_namespace('Materia', PKGPATH.'materia/classes/');

Autoloader::add_classes([
	'Fuel\\Session\\File'               => __DIR__.'/classes/session/file.php',
	'Materia\\Api_v1'                   => __DIR__.'/classes/api/v1.php',
	'Materia\\Community_manager'        => __DIR__.'/classes/community/manager.php',
	'Materia\\Notification_manager'     => __DIR__.'/classes/notification/manager.php',
	'Materia\\Perm_manager'             => __DIR__.'/classes/perm/manager.php',
	'Materia\\Score_manager'            => __DIR__.'/classes/score/manager.php',
	'Materia\\Score_record'             => __DIR__.'/classes/score/record.php',
	'Materia\\Session_activity'         => __DIR__.'/classes/session/activity.php',
	'Materia\\Session_log'              => __DIR__.'/classes/session/log.php',
	'Materia\\Session_logger'           => __DIR__.'/classes/session/logger.php',
	'Materia\\Session_play'             => __DIR__.'/classes/session/play.php',
	'Materia\\Storage_manager'          => __DIR__.'/classes/storage/manager.php',
	'Materia\\User_meta'                => __DIR__.'/classes/user/meta.php',
	'Materia\\Widget_Asset_manager'     => __DIR__.'/classes/widget/asset/manager.php',
	'Materia\\Widget_Instance_hash'     => __DIR__.'/classes/widget/instance/hash.php',
	'Materia\\Widget_Instance_manager'  => __DIR__.'/classes/widget/instance/manager.php',
	'Materia\\Widget_Question_Type_mc'  => __DIR__.'/classes/widget/question/type/mc.php',
	'Materia\\Widget_Question_Type_qa'  => __DIR__.'/classes/widget/question/type/qa.php',
	'Materia\\Widget_Question_answer'   => __DIR__.'/classes/widget/question/answer.php',
	'Materia\\Widget_Question_manager'  => __DIR__.'/classes/widget/question/manager.php',
	'Materia\\Widget_asset'             => __DIR__.'/classes/widget/asset.php',
	'Materia\\Widget_instance'          => __DIR__.'/classes/widget/instance.php',
	'Materia\\Widget_manager'           => __DIR__.'/classes/widget/manager.php',
	'Materia\\Widget_question'          => __DIR__.'/classes/widget/question.php',
	'Materia\\api'                      => __DIR__.'/classes/api.php',
	'Materia\\message'                  => __DIR__.'/classes/message.php',
	'Materia\\notification'             => __DIR__.'/classes/notification.php',
	'Materia\\perm'                     => __DIR__.'/classes/perm.php',
	'Materia\\utils'                    => __DIR__.'/classes/utils.php',
	'Materia\\widget'                   => __DIR__.'/classes/widget.php',
]);

// load package config
Config::load('materia', true);

// \Event::register('Materia.encrypt', 'Api::encrypt');
// \Event::register('Materia.decrypt', 'Api::decrypt');
\Event::register('delete_widget_event', '\Model_Notification::on_widget_delete_event');

// A function to trace stuffs to the log
function trace($arg, $force=0, $incbacklog=0)
{
	logger(Fuel::L_DEBUG, print_r($arg, true));
	return true;
}
