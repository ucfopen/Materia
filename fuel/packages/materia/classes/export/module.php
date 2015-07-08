

 <?php
DELETE ME

// /**
//  * Manages export functionality for any given module (inst).
//  * This is the base export module extended by each widget to include custom log exporting options.
//  * Each method in this class:
//  *		- must accept semesters_string as the sole parameter
//  *		- must return an array as follows:
//  *			[<the payload>, (string) <the file type being output, including dot .>]
//  *
//  *			example:
//  *			[$payload_data, ".csv"]
//  */

// namespace Materia;

// abstract class Export_Module
// {
// 	public $inst;

// 	/**
// 	 * @param int     The play ID of the game being scored
// 	 */
// 	public function __construct($inst)
// 	{
// 		$this->inst = $inst;
// 	}

// 	/**
// 	 * Prepares and then pushes a csv file
// 	 *
// 	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
// 	 */
// 	public function csv($semesters_string)
// 	{
// 		$semesters = explode(',', $semesters_string);
// 		$play_logs = [];
// 		$results   = [];


// 		foreach ($semesters as $semester)
// 		{
// 			list($year, $term) = explode('-', $semester);
// 			// Get all scores for each semester
// 			$logs = $play_logs[$year.' '.$term] = \Materia\Session_Play::get_by_inst_id($this->inst->id, $term, $year);

// 			foreach ($logs as $play)
// 			{
// 				$uname = $play['username'];

// 				// Only report actual user scores, no guests
// 				if ($uname)
// 				{
// 					if ( ! isset($results[$uname])) $results[$uname] = ['score' => 0];

// 					$results[$uname]['semester']   = $semester;
// 					$results[$uname]['last_name']  = $play['last'];
// 					$results[$uname]['first_name'] = $play['first'];
// 					$results[$uname]['score']      = max($results[$uname]['score'], $play['perc']);
// 				}
// 			}
// 		}

// 		// If there aren't any logs throw a 404 error
// 		if (count($play_logs) == 0) throw new HttpNotFoundException;

// 		// Table headers
// 		$csv = "User ID,Last Name,First Name,Score,Semester\r\n";

// 		foreach ($results as $userid => $r)
// 		{
// 			$csv .= "$userid,{$r['last_name']},{$r['first_name']},{$r['score']},{$r['semester']}\r\n";
// 		}

// 		return array($csv, ".csv");
// 	}


// }
