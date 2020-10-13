<?php

namespace Materia;

class Log
{
	/**
	 * reusable stuffs
	 */
	protected static $monolog = null;
	protected static $formatter = null;
	protected static $prev_type = null;

	public static function profile(array $msg, $type, $start_time = null)
	{
		! class_exists('Log') and \Package::load('log');

		$log_combine = \Config::get('log_combine', false);

		// ====== DEAL WITH THE MESSAGE ARRAY =========
		if ($start_time) $msg[] = round((microtime(true) - $start_time), 5); // if start time sent, calculate the elapsed and append

		$output = "$type: \"".implode('","', (array) $msg).'"';

		if ($log_combine)
		{
			\Fuel\Core\Log::debug($output);
		}
		else
		{
			$logger = static::prepare_logger($type);
			$logger->error($output);
		}
	}

	protected static function prepare_logger($type)
	{
		// ======= DEAL WITH MONOLOG ===============
		// setup monolog and the stream handler that writes to each specific file
		if ( ! isset(static::$monolog))
		{
			static::$monolog = new \Monolog\Logger('profiles');
			static::$formatter = new \Monolog\Formatter\LineFormatter('%level_name% - %datetime% --> %message%'.PHP_EOL, 'Y-m-d\TH:i:sO', true);
		}

		// if the profile type has changed (prev null or different)
		if (static::$prev_type !== $type)
		{
			if ( ! empty(static::$prev_type))
			{
				static::$monolog->popHandler(); // remove any previous handlers
			}
			$filename = static::prepare_file($type);

			$handler_factory = \Config::get('log_handler_factory', false);
			if (is_callable($handler_factory))
			{
				$handler = $handler_factory(get_defined_vars(), \Monolog\Logger::DEBUG);
			}

			if ( ! $handler instanceof \Monolog\Handler\AbstractProcessingHandler)
			{
				$handler = new \Monolog\Handler\RotatingFileHandler($filename, 0, \Monolog\Logger::DEBUG);
			}

			$handler->setFormatter(static::$formatter);
			static::$monolog->pushHandler($handler);
			static::$prev_type = $type;
		}

		return static::$monolog;
	}

	protected static function prepare_file($type)
	{
		// load the file config
		\Config::load('file', true);

		// determine the name and location of the logfile
		$filepath = \Config::get('log_path').DS;

		if ( ! is_dir($filepath))
		{
			$old = umask(0);
			mkdir($filepath, \Config::get('file.chmod.folders', 0777), true);
			umask($old);
		}

		return $filepath.DS.$type;
	}
}
