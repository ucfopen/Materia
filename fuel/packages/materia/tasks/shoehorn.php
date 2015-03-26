<?php

namespace Fuel\Tasks;

class Shoehorn extends \Basetask
{
	public static function output_ucf_id_conversion($to_file = false)
	{
		$materia_user_table = "users";
		$cerebro_user_table = "CDLPS_PEOPLE";
		$nid = "network_id";
		$ucf_id = "pps_number";

		\Cli::write("This will output the raw SQL for the conversion script.");
		\Cli::write("Before continuing, make sure the database settings are correct");

		$all_users = \DB::select("id", "username")
			->from($materia_user_table)
			->as_assoc();

		if ($to_file) {
			static::write_to_file($all_users->compile());
		}
		else
		{
			echo($all_users->compile()."\n");
		}

		$all_users = $all_users->execute();

		foreach ($all_users as $user) {
			if (preg_match("/^~{0}[a-zA-Z0-9]+$/", $user["username"]) == 0) {
				continue;
			}
			else
			{
				$user_id = $user["id"];
				$user_name = $user["username"];

				$results = \DB::select("pps_number")
					->from($cerebro_user_table)
					->where($nid, $user_name)
					->as_assoc();

				if ($to_file) {
					static::write_to_file($results->compile());
				}
				else
				{
					echo($results->compile()."\n");
				}

				$results = $results->execute("ucf");

				if (count($results) > 0) {

					$results_array = $results->as_array()[0];
					$user_ucf_id = $results_array[$ucf_id];

					$status = \DB::update("users")
						->set([
							'username' => $user_ucf_id
						])
						->where("id", $user_id);

					if ($to_file) {
						static::write_to_file($status->compile());
					}
					else
					{
						echo($status->compile()."\n");
					}
				}
			}
		}
	}

	public static function run_ucf_id_conversion()
	{
		\Cli::write("Warning: THIS WILL MAKE PERMANENT CHANGES TO THE MATERIA DB");

		if (\Cli::prompt("Continue? Y/n", array("Y", "n")) != "Y") return;

		\Cli::write("Fetching users...");

		$all_users = static::get_all_users();
		$user_count = count($all_users);

		\Cli::write($user_count." users found. Ready to run conversion.");

		if (\Cli::prompt("Continue? Y/n", array("Y", "n")) != "Y") return;

		\Cli::write("Converting...");

		$updated_count = 0;
		$skipped_count = 0;
		$missed_count = 0;
		$failed_count = 0;

		foreach ($all_users as $user) {
			if (preg_match("/^~{0}[a-zA-Z0-9]+$/", $user["username"]) == 0) {
				$skipped_count++;
				continue;
			}
			else
			{
				$user_id = $user["id"];
				$ucf_id = static::get_ucf_id_for_user($user["username"]);

				if ($ucf_id == false) {
					$missed_count++;
				}
				else
				{
					$success = static::update_username($user_id, $ucf_id);

					if ($success > 0) {
						$updated_count++;
					}
					else
					{
						$failed_count++;
					}
				}
			}
		}

		\Cli::write("\n\nButcher's Bill:");
		\Cli::write("Total users: ".$user_count);
		\Cli::write("Skipped: ".$skipped_count);
		\Cli::write("Missed (no UCFID): ".$missed_count);
		\Cli::write(\Cli::color("Updated: ".$updated_count, "green"));
		\Cli::write(\Cli::color("Failed: ".$failed_count, "red"));

	}


	public static function get_ucf_id_for_user($user_id)
	{
		$cerebro_user_table = "CDLPS_PEOPLE";
		$nid = "network_id";
		$ucf_id = "pps_number";

		$results = \DB::select()
			->from($cerebro_user_table)
			->where($nid, $user_id)
			->as_assoc()
			->execute("ucf");

		if (count($results) > 0) {

			$results_array = $results->as_array()[0];
			$user_ucf_id = $results_array[$ucf_id];

			return $user_ucf_id;
		}
		else {
			return false;
		}
	}

	public static function get_all_users()
	{
		$materia_user_table = "users";

		$all_users = \DB::select()
			->from($materia_user_table)
			->as_assoc()
			->execute();

		return $all_users;
	}

	public static function update_username($user_id, $ucf_id) {

		$status = \DB::update("users")
			->set([
				'username' => $ucf_id
			])
			->where("id", $user_id)
			->execute();

		return $status;
	}

	public static function write_to_file($str) {
		file_put_contents("conversion_output.txt", $str."\n", FILE_APPEND);
	}

}