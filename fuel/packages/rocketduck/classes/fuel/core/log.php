<?php
class Log extends Fuel\Core\Log
{


	/**
	 * initialize the created the monolog instance
	 */
	public static function initialize()
	{
		// load the file config
		\Config::load('file', true);

		// determine the name and location of the logfile
		$path     = \Config::get('log_path', APPPATH.'logs'.DS);
		$filename = \Config::get('log_file', 'materia');
		if (empty($filename))
		{
			$filename = 'materia';
		}
		$filepath = $path.$filename;

		// make sure the log directories exist
		if ( ! is_dir($path))
		{
			$permission = \Config::get('file.chmod.folders', 0777);
			mkdir($path, 0777, true);
			chmod($path, $permission);
		}

		if ($handler_factory = \Config::get('log_handler_factory'))
		{
			$handler = $handler_factory(get_defined_vars(), \Monolog\Logger::DEBUG);
		}
		else
		{
			$handler = new \Monolog\Handler\RotatingFileHandler($filepath, 0, \Monolog\Logger::DEBUG);
		}

		$formatter = new \Monolog\Formatter\LineFormatter("%level_name% - %datetime% --> %message%".PHP_EOL, "Y-m-d H:i:s", true);
		$handler->setFormatter($formatter);
		static::$monolog->pushHandler($handler);
	}
}
