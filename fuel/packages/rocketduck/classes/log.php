<?php

namespace RocketDuck;

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

		// ======= DEAL WITH MONOLOG ===============
		// setup monolog and the stream handler that writes to each specific file
		if ( ! isset(static::$monolog))
		{
			static::$monolog = new \Monolog\Logger('profiles');
			static::$formatter = new \Monolog\Formatter\LineFormatter('%message%'.PHP_EOL, 'Y-m-d H:i:s', true);
		}

		// if the profile type has changed (prev null or different)
		if (static::$prev_type !== $type)
		{
			if ( ! empty(static::$prev_type))
			{
				static::$monolog->popHandler(); // remove any previous handlers
			}
			$file = static::prepare_file($type);
			$handler = new \Monolog\Handler\StreamHandler($file, \Monolog\Logger::DEBUG);
			$handler->setFormatter(static::$formatter);
			static::$monolog->pushHandler($handler);
			static::$prev_type = $type;
		}


		// ====== DEAL WITH THE MESSAGE ARRAY =========
		$msg[] = time(); // add timestamp to values
		if ($start_time) $msg[] = round((microtime(true) - $start_time), 5); // if start time sent, calculate the elapsed and append

		static::$monolog->error('"'.implode('","', (array) $msg).'"');
	}

	protected static function prepare_file($type)
	{
				// ======= DEAL WITH THE FILE AND DIRECTORY =====
		// load the file config
		\Config::load('file', true);

		// determine the name and location of the logfile
		$filepath = \Config::get('log_path').date('Y/m').'/';

		if ( ! is_dir($filepath))
		{
			$old = umask(0);
			mkdir($filepath, \Config::get('file.chmod.folders', 0777), true);
			umask($old);
		}

		$filename = $filepath.date('d')."-$type.php";

		if ( ! file_exists($filename))
		{
			file_put_contents($filename, '<'."?php defined('COREPATH') or exit('No direct script access allowed'); ?".'>'.PHP_EOL.PHP_EOL);
		}
		return $filename;
	}
}
