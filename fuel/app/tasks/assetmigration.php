<?php

namespace Fuel\Tasks;

class Assetmigration
{
	public static function run_asset_migration()
	{
		// Config Variables
		$bash_file = "assets_to_s3.sh";
		$sql_file = "update_asset_remote_urls.sql";
		$s3_bucket_name = "fakes3";

		// checks to see that user understands instructions
		if (!static::accept_instructions($bash_file, $sql_file)) return;

		// Create the files to be written to
		if(!static::initialize_output_files($bash_file, $sql_file))
		{
			\Cli::write("Error opening file!");
			die("Error opening file");
		}

		\Cli::write("Fetching assets...");

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
			$local_path = $asset_id.".".$asset_type;
			$bucket_path = $s3_bucket_name."/".$user_id."/".$asset_id.".".$asset_type;

			fwrite($temp_bash_stream, "aws --endpoint-url='http://s3.amazonaws.com:10001' s3 cp "
				.$local_path." s3://".$bucket_path."\n");
			fwrite($temp_sql_stream, static::generate_update_query($asset_id, $bucket_path));

			$updated_count++;
		}

		fclose($temp_sql_stream);
		fclose($temp_bash_stream);

		\Cli::write($updated_count."/".$asset_count." assets were successfully given a remote url!");

		return;
	}

	private static function accept_instructions($bash_filename, $sql_filename)
	{
		\Cli::write("Welcome to the Materia User Asset Migration Process!\n");

		\Cli::write("IMPORTANT: This script does not perform the migration itself.
			The script generates a bash and sql file that can be used to perform the
			migration.\n");

		\Cli::write("Before you begin, here is an outline of the process:");
		\Cli::write("1. Two files will be generated: ".$bash_filename." and ".$sql_filename.".");
		\Cli::write("2. All items will be selected from the Materia Database asset table.");
		\Cli::write("3. Using properties of the asset, a remote url will be generated with the following form: s3_bucket_url/user_id/asset_id.asset_type");
		\Cli::write("4. An update query will also be generated using the previously constructed remote URL along with a status of migrated_asset");
		\Cli::write("\n");

		return (\Cli::prompt("Continue with the migration? Y/n", array("Y", "n")) == "Y");
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

	private static function get_all_assets()
	{
		$materia_assets_table = "asset";

		$all_assets = \DB::select()
						->from($materia_assets_table)
						->as_assoc()
						->execute();

		return $all_assets;
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

	private static function generate_update_query($id, $remote_url)
	{
		$asset_table_name = "asset";

		return "UPDATE ".$asset_table_name." SET remote_url='".$remote_url."',
			status = 'migrated_asset' WHERE id='".$id."';\n";
	}
}
/* End of file tasks/assetmigration.php */
