<?php
namespace Materia;
use \Materia\Util_Validator;

class Storage_Manager
{

	static public function parse_and_store_storage_array($inst_id, $play_id, $user_id, $storage_packet)
	{
		if (Util_Validator::is_valid_hash($inst_id) && Util_Validator::is_valid_long_hash($play_id)) // valid pid & not a preview
		{
			if (count($storage_packet) > 0)
			{
				foreach ($storage_packet as $storage)
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

	static public function get_table_summaries_by_inst_id($inst_id)
	{
		if (Util_Validator::is_valid_hash($inst_id)) // valid pid & not a preview
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
					GROUP BY T1.id, T1.name, T1.created_at, T1.year, T1.semester
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

	static public function get_storage_data($inst_id, $year = '', $term = '', $tablename = '', $anonymize = false)
	{
		if (Util_Validator::is_valid_hash($inst_id)) // valid pid & not a preview
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

			return self::process_log_data($result, $anonymize);
		}
		return [];
	}

	static protected function process_log_data($results, $anonymize = false)
	{
		$tables   = [];
		$students = [];

		//in case we're anonymizing students, keep an increment
		$i = 0;

		foreach ($results as $r)
		{
			// Table
			if ( ! isset($tables[$r->name])) $tables[$r->name] = [];

			// data
			$data = (array) unserialize(base64_decode($r->data));
			ksort($data);

			// play info
			if ($anonymize)
			{
				$mock_student = new \stdClass();
				$mock_student->username = 'user'.$i;
				$mock_student->first = 'User';
				$mock_student->last = $i;
				$students[$r->user_id] = $mock_student;
				$i++;
			}
			if ( ! isset($students[$r->user_id])) $students[$r->user_id] = \Model_User::find($r->user_id);

			$student = $students[$r->user_id];
			$play = [
				'user'      => ($student ? $student->username : 'Guest'),
				'firstName' => ($student ? $student->first : ''),
				'lastName'  => ($student ? $student->last : ''),
				'time'      => $r->created_at,
				'cleanTime' => date('m/d/Y H:i:s T', $r->created_at),
				'play_id'   => $r->play_id,
			];

			$tables[$r->name][] = ['play' => $play, 'data' => $data];
		}

		return $tables;
	}

}
