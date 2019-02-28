<?php

namespace Fuel\Tasks;

class Assets
{
	public static function copy_assets(string $from_driver_name, string $to_driver_name): void
	{
		// let the user set the environment
		if (\Cli::option('skip_prompts', false) != true)
		{
			\Fuel::$env = \Cli::prompt('Choose your environment', ['development', 'production', 'staging']);
		}

		\Cli::write("FuelPHP environment set to: '".\Fuel::$env."'");

		$from_driver = \Materia\Widget_Asset::get_storage_driver($from_driver_name);
		$to_driver = \Materia\Widget_Asset::get_storage_driver($to_driver_name);

		// Get all assets
		$results = \DB::select('id')
			->from('asset')
			->execute();

		if ( ! $results->count()) exit('No assets in database');

		$count = 0;

		foreach ($results as $res)
		{
			$id = $res['id'];
			$size = 'original';
			$asset = \Materia\Widget_Asset::fetch_by_id($id);
			if ($from_driver->exists($id, $size))
			{
				if ( ! $to_driver->exists($id, $size))
				{
					\Cli::write("Copying asset: {$id} from {$from_driver_name} >>> {$to_driver_name}");
					$tmp_file = tempnam(sys_get_temp_dir(), "asset_{$id}_");
					$from_driver->retrieve($id, $size, $tmp_file);
					$to_driver->store($asset, $tmp_file, $size);
					\Cli::write(' 👍 Complete');
					$count++;
				}
				else
				{
					\Cli::write("Skipping asset: {$id}, already in {$to_driver_name}");
				}
			}
			else
			{
				\Cli::write("Skipping asset: {$id}, missing from {$from_driver_name}");
			}
		}
		\Cli::write('=======================');
		\Cli::write("{$results->count()} assets found.");
		\Cli::write("{$count} assets copied.");
	}
}

