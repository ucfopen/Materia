<?php

namespace Fuel\Tasks;

class Assetmigration
{
	public static function run_asset_migration()
	{
		$bash_file = "assets_to_s3.sh";
		$sql_file = "write_asset_remote_urls.sql";

		\Cli::write("Warning: THIS WILL MAKE PERMANENT CHANGES TO THE MATERIA DB");
		if (\Cli::prompt("Continue? Y/n", array("Y", "n")) != "Y") return;

		if(!static::initialize_output_files($bash_file, $sql_file))
		{
			\Cli::write("Error opening file!");
			die("Error opening file");
		}

		\Cli::write("Fetching assets...");

		// make sure to leave a trailing slash
		$s3_bucket_url = "s3://fakes3/";

		$all_assets = static::get_all_assets();
		$asset_count = count($all_assets);

		// Metric to make sure all assets were uploaded
		$updated_count = 0;

		\Cli::write("Generating asset queries and commands...");
		// Prepare the file files to be written to
		$temp_bash_stream = fopen($bash_file, "w");
		$temp_sql_stream = fopen($sql_file, "w");

		foreach ($all_assets as $asset)
		{
			// Asset Properties
			$asset_id = $asset["id"];
			$asset_type = $asset["type"];
			$asset_title = $asset["title"];
			$user_id = static::get_user_id_of_asset($asset_id);

			// Asset Paths
			$local_path = $asset_title;
			$bucket_path = $s3_bucket_url.$user_id."/".$asset_id.".".$asset_type;

			fwrite($temp_bash_stream, "aws --endpoint-url='http://s3.amazonaws.com:10001' s3 cp ".$local_path." ".$bucket_path."\n");
			fwrite($temp_sql_stream, static::generate_update_query($asset_id, $bucket_path));

			$updated_count++;
		}

		fclose($temp_sql_stream);
		fclose($temp_bash_stream);

		\Cli::write($updated_count."/".$asset_count." assets were successfully given a
			remote url!");

		return;
	}

	private static function generate_update_query($id, $remote_url)
	{
		$asset_table_name = "asset";

		return "UPDATE ".$asset_table_name." SET remote_url='".$remote_url."'
			WHERE id='".$id."';\n";
	}

	private static function get_all_assets()
	{
		$materia_assets_table = "asset";

		$all_assets = \DB::select()
						->from($materia_assets_table)
						->as_assoc()
						->execute();

		return $all_assets;
	}

	public static function initialize_output_files($bash_filename, $sql_filename)
	{
		\Cli::write("Initializing bash script...");
		if(!$bash_file = fopen($bash_filename, "w"))
			return false;

		$file_contents = "# This file holds all of the bash commands to upload Materia assets
			to Amazon s3.\n";
		fwrite($bash_file, $file_contents);
		fclose($bash_file);

		\Cli::write("Initializing sql file...");
		if(!$mysql_file = fopen($sql_filename, "w"))
			return false;

		$file_contents = "# This file holds all of the bash commands to upload Materia assets
			to Amazon s3.\n";
		fwrite($mysql_file, $file_contents);
		fclose($mysql_file);

		return true;
	}

	// Get object the asset is associated with
	private static function get_user_id_of_asset($asset_id)
	{
		$asset_to_user_table = "perm_object_to_user";

		// Returns the id of the object
		$results = \DB::select("user_id")
							->from($asset_to_user_table)
							->where('object_id', '=', $asset_id)
							->execute();

		// there should only be one id per asset_id, so we can assume index 0 is
		// is the only element
		return $results[0]["user_id"];
	}
}
/* End of file tasks/assetmigration.php */
