<?php

namespace Fuel\Tasks;

class Semester extends \Basetask
{
	static public function populate($start_year = null, $end_year = null)
	{
		if ( ! $start_year || ! $end_year)
		{
			\Cli::write(\Cli::color('Missing parameters', 'yellow'));
			\Cli::write(\Cli::color('EX: php oil refine semester:populate startyear endyear', 'yellow'));
			return;
		}

		$semester = [
			//Spring semester (December 7 - May 3)
			'Spring' => [
				'Start' => 'Jan 1, ',
				'End' => 'May 3, ',
			],
			//Summer semester (May 3 - August 7)
			'Summer' => [
				'Start' => 'May 3, ',
				'End' => 'August 7, ',
			],
			//Fall semester (August 7 - December 7)
			'Fall' => [
				'Start' => 'August 7, ',
				'End' => 'Dec 31, ',
			],
		];

		$year_counter = $start_year;

		$values = [];

		while ($end_year >= $year_counter)
		{
			foreach ($semester as $key => $value)
			{
				if (isset($semester_end)) $semester_start = $semester_end + 1;
				else $semester_start = strtotime($semester[$key]['Start'].$year_counter) + 1;
				$semester_end = strtotime($semester[$key]['End'].$year_counter);
				$values[] = "('$key', $year_counter, $semester_start, $semester_end)";
			}
			$year_counter++;
		}

		$imploded_values = implode(", \n", $values);

		if ($start_year >= 2038 || $end_year >= 2038)
		{
			\Cli::write(\Cli::color("Date range outside of 32 bit unix range (google: 'year 2038 problem')", 'red'));
			exit(1);  // linux exit code 1 = error
		}
		elseif ($start_year < 1902 || $end_year < 1902)
		{
			\Cli::write(\Cli::color('Are you expecting users to time travel?', 'red'));
			exit(1);  // linux exit code 1 = error
		}
		else
		{
			list($id, $num) = \DB::query('INSERT IGNORE
								INTO '.\DB::quote_table('date_range').'
								(semester,
								 year,
								 start_at,
								 end_at)
								VALUES
								'.$imploded_values,
								\DB::INSERT
							)
							->execute();

			if ($num == 1)
			{
				\Cli::write(\Cli::color("$num Semester added", 'green'));
			}
			elseif ($num == 0)
			{
				\Cli::write(\Cli::color('Specified Semesters already in the database.', 'yellow'));
			}
			else
			{
				\Cli::write(\Cli::color("$num semesters added from Spring $start_year to Fall $end_year.", 'green'));
			}
		}
	}
}





























