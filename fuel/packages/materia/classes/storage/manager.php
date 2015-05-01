<?php
/**
 * Materia
 * It's a thing
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */

namespace Materia;

class Storage_Manager
{

	static public function parse_and_store_storage_array($inst_id, $play_id, $user_id, $storagePacket)
	{
		if(\RocketDuck\Util_Validator::is_valid_hash($inst_id) && \RocketDuck\Util_Validator::is_valid_long_hash($play_id)) // valid pid & not a preview
		{
			if(count($storagePacket) > 0)
			{
				foreach($storagePacket AS $storage)
				{
					list($id,$num) = \DB::insert('log_storage')
						->set([
							'inst_id'    => $inst_id,
							'play_id'    => $play_id,
							'user_id'    => $user_id,
							'name'       => $storage->name,
							'created_at' => time(),
							'data'       => base64_encode(serialize($storage->data))
							])
						->execute();
				}
			}
		}
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_table_summaries_by_inst_id($inst_id)
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id)) // valid pid & not a preview
		{
			$result = \DB::query(
				'SELECT
					name AS tableName,
					created_at AS updated,
					COUNT(*) AS count,
					id,
					year,
					semester AS term
					FROM
					(
						SELECT *
						FROM '.\DB::quote_table('log_storage').' S
						JOIN '.\DB::quote_table('date_range').' D
						ON S.created_at BETWEEN D.start_at AND D.end_at
						WHERE S.inst_id = :inst_id
						ORDER BY S.created_at DESC
					) T1
					GROUP BY T1.id, T1.name
					ORDER BY T1.id DESC'
				, \DB::SELECT)
				->param('inst_id', $inst_id)
				->execute()
				->as_array();

			$return = [];
			foreach ($result as $table)
			{
				if ( ! isset($return[$table['id']]))
				{
					$return[$table['id']] = ['id' => (int)$table['id'], 'term' => $table['term'], 'year' => $table['year'], 'data' => []];
				}

				$return[$table['id']]['data'][] = ['name' => $table['tableName'], 'count' => (int)$table['count'], 'updated' => $table['updated']];
			}
			return $return;
		}
		return 0;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_logs_by_inst_id($inst_id, $year = '', $term = '', $tablename = '')
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id)) // valid pid & not a preview
		{
			$term = ucfirst($term);
			$semester_only = $term !== '' && $year !== '';

			$query = \DB::select('date_range.id', 'date_range.year', ['date_range.semester', 'term'], 'log_storage.*')
				->from('log_storage')
				->join('date_range')
				->on('log_storage.created_at', '>=', 'date_range.start_at')
				->and_on('log_storage.created_at', '<=', 'date_range.end_at')
				->where('log_storage.inst_id', '=', $inst_id);

			if ($semester_only)
			{
				$query->and_where('date_range.semester', $term)
					->and_where('date_range.year', $year);
			}
			if ($tablename !== '')
			{
				$query->and_where('log_storage.name', $tablename);
			}

			$result = $query->as_object()->execute();

			return self::process_log_data($result);
		}
		return [];
	}

	static protected function process_log_data($results)
	{
		$tables = [];
		$students = [];

		foreach ($results as $r)
		{
			// Table
			if ( ! isset($tables[$r->name]))
			{
				$tables[$r->name] = [];
			}

			// data
			$data = (array) unserialize(base64_decode($r->data));
			ksort($data);

			// play info
			$play = [];

			if ( ! isset($students[$r->user_id]))
			{
				$students[$r->user_id] = \Model_User::find($r->user_id);
			}
            $play['user']      = $students[$r->user_id] ? $students[$r->user_id]->username : "Guest";
			$play['firstName'] = $students[$r->user_id] ? $students[$r->user_id]->first : "";
			$play['lastName']  = $students[$r->user_id] ? $students[$r->user_id]->last : "";
			$play['time']      = $r->created_at;
			$play['play_id']   = $r->play_id;

			$tables[$r->name][] = ['play' => $play, 'data' => $data];
		}

		return $tables;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function get_csv_logs_by_inst_id($inst_id, $tablename, $semesters = false)
	{
		$num_records = 0;
		$data = [];
		if ($semesters)
		{
			foreach ($semesters as $semester)
			{
				$year_and_term = explode('-', $semester);
				$result = Storage_Manager::get_logs_by_inst_id($inst_id, $year_and_term[0], $year_and_term[1], $tablename);
				if (isset($result[$tablename]))
				{
					$data[$semester] = $result[$tablename];
					$num_records += count($data[$semester]);
				}
			}
		}
		else
		{
			$result = Storage_Manager::get_logs_by_inst_id($inst_id, '', '', $tablename);
			if (isset($result[$tablename]))
			{
				$data['all'] = $result[$tablename];
				$num_records = count($data['all']);
			}
		}

		$logs_string = '';
		if ($num_records > 0)
		{
			$fields = [];

			//Determine all the fields used
			foreach ($data as $table)
			{
				foreach ($table as $row)
				{
					$row_data = $row['data'];
					$play = $row['play'];
					$keys = array_keys($row_data);
					foreach ($keys as $key)
					{
						if ( ! isset($fields[$key]))
						{
							$fields[$key] = '';
						}
					}
				}
			}

			// print out header row
			ksort($fields);
			$logs_string = '"'.implode('","', array_keys($fields)).'","'.implode('","', array_keys($play)).($semesters? '","semester"' : '"')."\n";

			//Fill in the holes
			foreach ($data as $semester_str => $table)
			{
				$year_and_term = explode('-', $semester_str);
				$year_and_term[1] = ucfirst(strtolower($year_and_term[1]));
				$len = count($data[$semester_str]);
				for ($i = 0; $i < $len; $i++)
				{
					$data[$semester_str][$i]['data'] = $data[$semester_str][$i]['data'] + $fields;
					ksort($data[$semester_str][$i]['data']);

					$logs_string .= '"'.implode('","', $data[$semester_str][$i]['data']);
					$logs_string .= '","'.implode('","', $data[$semester_str][$i]['play']);
					$logs_string .= ($semesters ? '","'.$year_and_term[0].' '.$year_and_term[1] : '').'"'."\n";
				}
			}
		}

		return $logs_string;
	}

}
