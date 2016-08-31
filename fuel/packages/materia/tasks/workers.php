<?php

namespace Fuel\Tasks;

use \RocketDuck\Log;

class Workers extends \Basetask
{

	// Start Workers: php oil r workers
	public static function run()
	{
		$gman = \Lib_Gearman::create_worker();

		$gman->addFunction("test", '\Fuel\Tasks\Workers::test', 10);
		$gman->addFunction("build_export_data", '\Fuel\Tasks\Workers::build_export_data', 300);

		\Lib_Gearman::start_worker($gman);
	}

	public static function test($job)
	{
		$workload = $job->workload();
		Log::profile(["reverse", 'workload', $workload], 'worker');
		return time();
	}

	protected static function require_keys($array, $keys)
	{
		foreach ($keys as $value)
		{
			if ( ! array_key_exists($value, $array))
			{
				Log::profile(["worker", "missing key", $value], 'worker');
				return false;
			}
		}

		return true;
	}

	public static function build_export_data($job)
	{
		Log::profile(["build_export_data", 'workload', $job->workload()], 'worker');

		$workload = json_decode($job->workload(), true);
		if ( ! self::require_keys($workload, ['inst_id', 'export_type', 'semester_ids', 'filename', 'user_id'])) return false;
		Log::profile(["build_export_data", 'file', $workload['filename']], 'worker');

		$create_file = true;

		// Document already exists?
		\Config::load('file', true);
		$base_path = \Config::get('file.areas.documents.basedir');
		$list = glob($base_path.$workload['filename'].'.*'); //use glob, we dont know file extension yet :(
		if (count($list))
		{
			$filename = basename($list[0]);

			// mark the file to be created again IF it was created more then 10 minuts ago
			$create_file = (time() - filectime($base_path.$filename) > 600);
			if ($create_file)
			{
				Log::profile(["build_export_data", 'file_outdated', $workload['filename']], 'worker');
				\File::delete($filename, 'documents');
			}
		}

		if ($create_file)
		{
			$inst = \Materia\Widget_Instance_Manager::get($workload['inst_id']);

			try
			{
				$play_data = new \Materia\Session_PlayDataExporter($inst);
				list($data, $file_type) = $play_data->export($workload['export_type'], $workload['semester_ids']);
			}
			catch (\Exception $e)
			{
				Log::profile(["build_export_data", "error", "Error building data export: {$e->getMessage()} {$e->getFile()} {$e->getLine()}"], 'worker');
				return false;
			}

			$filename = $workload['filename'].$file_type;
			Log::profile(["build_export_data", 'writing', $filename], 'worker');

			\File::create('', $filename, $data, 'documents');

			Log::profile(["build_export_data", 'complete', ''], 'worker');
		}

		\Model_Notification::send_item_notification($workload['user_id'], $workload['user_id'], \Materia\Perm::DOCUMENT, $workload['inst_id'], $filename);
		return true;
	}
}
