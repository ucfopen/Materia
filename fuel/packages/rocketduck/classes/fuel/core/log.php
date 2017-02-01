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

		// make sure the log directories exist
		try
		{
			// determine the name and location of the logfile
			$path     = \Config::get('log_path', APPPATH.'logs'.DS);
			$filename = \Config::get('log_file', null);

			if(empty($filename))
			{
				$rootpath = $path.date('Y').DS;
				$filepath = $path.date('Y/m').DS;
				$filename = $filepath.date('d').'.php';
			}
			else
			{
				$rootpath = $path;
				$filepath = $path;
				$filename = $path.$filename;
			}

			// get the required folder permissions
			$permission = \Config::get('file.chmod.folders', 0777);

			if ( ! is_dir($rootpath))
			{
				mkdir($rootpath, 0777, true);
				chmod($rootpath, $permission);
			}
			if ( ! is_dir($filepath))
			{
				mkdir($filepath, 0777, true);
				chmod($filepath, $permission);
			}

			$handle = fopen($filename, 'a');
		}
		catch (\Exception $e)
		{
			\Config::set('log_threshold', \Fuel::L_NONE);
			throw new \FuelException('Unable to create or write to the log file. Please check the permissions on '.\Config::get('log_path').'. ('.$e->getMessage().')');
		}

		if ( ! filesize($filename))
		{
			fwrite($handle, "<?php defined('COREPATH') or exit('No direct script access allowed'); ?>".PHP_EOL.PHP_EOL);
			chmod($filename, \Config::get('file.chmod.files', 0666));
		}
		fclose($handle);

		if ($handler_factory = \Config::get('log_handler_factory'))
		{
			$stream = $handler_factory(get_defined_vars(), \Monolog\Logger::DEBUG);
		}
		else
		{
			$stream = new \Monolog\Handler\StreamHandler($filename, \Monolog\Logger::DEBUG);
		}

		$formatter = new \Monolog\Formatter\LineFormatter("%level_name% - %datetime% --> %message%".PHP_EOL, "Y-m-d H:i:s");
		$stream->setFormatter($formatter);
		static::$monolog->pushHandler($stream);
	}
}
