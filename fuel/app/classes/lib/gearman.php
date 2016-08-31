<?php
/**
 * Materia
 * License outlined in licenses folder
 */

// namespace Lib;

class Lib_Gearman
{
	static public function create_cient()
	{
		Config::load('gearman', true);
		$gman_host = Config::get('gearman.host');
		$gman_port = Config::get('gearman.port');
		$gman = new GearmanClient();
		$gman->addServer($gman_host, $gman_port);
		return $gman;
	}

	static public function create_worker()
	{
		\Config::load('gearman', true);
		$gman_host = \Config::get('gearman.host');
		$gman_port = \Config::get('gearman.port');
		$gman = new \GearmanWorker();
		$gman->addServer($gman_host, $gman_port);
		return $gman;
	}

	static public function start_worker($worker)
	{
		\RocketDuck\Log::profile(['worker', 'started', ''], 'worker');
		while($worker->work())
		{
			if ($worker->returnCode() != GEARMAN_SUCCESS)
			{
				\RocketDuck\Log::profile(["worker", "return_code", $worker->returnCode()], 'worker');
				break;
			}
		}
	}

}
