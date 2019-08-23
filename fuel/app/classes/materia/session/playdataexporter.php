<?php

namespace Materia;

class Session_PlayDataExporter
{
	protected $inst;
	protected $custom_methods_bound = false;
	protected $custom_methods = [];

	public function __construct($inst)
	{
		$this->inst = $inst;
	}

	public function export($unclean_name, $semesters_string)
	{
		$name = \Materia\Widget::make_clean_export_method_name($unclean_name);
		$semesters = explode(',', $semesters_string);

		// try a class methods
		if (method_exists($this, $name)) return static::$name($this->inst, $semesters);

		// try playdata exporter methods
		return $this->execute_playdata_exporter_method($name, [$this->inst, $semesters]);
	}

	// this calls the method defined in the widget's playdata_exporters.php file
	// @param String method name to call from playdata exporter methods defined in widget
	// $arguments[]:
	//  0 - @param \Materia\Widget_Instance
	//  1 - @param Array semesters
	// ex setup:
	// playdata_exports.php: <? return ['My Special Method' => function($inst, $semesters){ return ['no data', '.csv'];}];
	protected function execute_playdata_exporter_method($clean_method_name, Array $arguments)
	{
		$methods = $this->inst->widget->get_playdata_exporter_methods();

		if ( ! array_key_exists($clean_method_name, $methods))
		{
			throw new \RuntimeException("Playdata exporter Method {$clean_method_name} does not exist");
		}

		return call_user_func_array($methods[$clean_method_name], $arguments);
	}

	protected static function storage($inst, $semesters)
	{
		$table_name   = \Input::get('table');
		$anonymize    = filter_var(\Input::get('anonymized', false), FILTER_VALIDATE_BOOLEAN);
		$num_records  = 0;
		$storage_data = [];
		$csv          = '';

		if (empty($table_name)) throw new \Exception('Missing required storage table name');

		// load the logs for all selected semesters
		if (empty($semesters))
		{
			$loaded_data = Storage_Manager::get_storage_data($inst->id, '', '', $table_name, $anonymize);
			if ( ! empty($loaded_data[$table_name]))
			{
				$storage_data['all'] = $loaded_data[$table_name];
				$num_records = count($storage_data['all']);
			}
		}
		else
		{
			foreach ($semesters as $semester)
			{
				list($year, $term) = explode('-', $semester);
				$loaded_data = Storage_Manager::get_storage_data($inst->id, $year, $term, $table_name, $anonymize);
				if ( ! empty($loaded_data[$table_name]))
				{
					$storage_data[$semester] = $loaded_data[$table_name];
					$num_records += count($storage_data[$semester]);
				}
			}
		}

		if ($num_records)
		{
			$fields = [];

			//Determine all the fields used
			foreach ($storage_data as $table)
			{
				foreach ($table as $row)
				{
					$play = $row['play'];
					$keys = array_keys($row['data']);
					foreach ($keys as $key)
					{
						if ( ! isset($fields[$key])) $fields[$key] = '';
					}
				}
			}

			// create out header row
			ksort($fields);
			$csv = '"'.implode('","', array_keys($fields)).'","'.implode('","', array_keys($play)).($semesters ? '","semester"' : '"')."\n";

			// fill in the data for each row
			foreach ($storage_data as $semester_str => $table)
			{
				list($year, $term) = explode('-', $semester);
				$term = ucfirst(strtolower($term));
				$len = count($storage_data[$semester_str]);
				for ($i = 0; $i < $len; $i++)
				{
					$d =& $storage_data[$semester_str][$i];
					$d['data'] = $d['data'] + $fields;
					ksort($d['data']);

					$csv .= '"'.implode('","', $d['data']).'",';
					$csv .= '"'.implode('","', $d['play']).'"';
					if ( ! empty($semesters)) $csv .= ",\"{$year} {$term}\"";
					$csv .= "\n";
				}
			}
		}

		return [$csv, "-storage-{$table_name}.csv"];
	}

	protected static function all_scores($inst, $semesters)
	{
		$play_logs = [];
		$count = 0;

		// Table headers
		$csv = "User ID,Last Name,First Name,Score,Semester\r\n";

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
			// Get all scores for each semester
			$logs = $play_logs["{$year} {$term}"] = \Materia\Session_Play::get_by_inst_id($inst->id, $term, $year);

			foreach ($logs as $play)
			{
				// ignore non-guest plays when exporting all scores
				if ($play['user_id']) continue;
				$condensed = [
					'Guest '.++$count,
					'last_name' => $play['last'],
					'first_name' => $play['first'],
					'score' => $play['perc'],
					'semester' => $semester
				];

				$csv .= implode(',', $condensed)."\r\n";
			}
		}

		// If there aren't any logs throw a 404 error
		if ($count == 0) throw new HttpNotFoundException;

		return [$csv, '.csv'];
	}

	/**
	 * Prepares high score csv file
	 *
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	protected static function high_scores($inst, $semesters)
	{
		$play_logs = [];
		$results   = [];

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
			// Get all scores for each semester
			$logs = $play_logs["{$year} {$term}"] = \Materia\Session_Play::get_by_inst_id($inst->id, $term, $year);

			foreach ($logs as $play)
			{
				// Only report actual user scores, no guests
				if ( ! empty($play['username']))
				{
					$u = $play['username'];
					if ( ! isset($results[$u])) $results[$u] = ['score' => 0, 'last_name' => $play['last'], 'first_name' => $play['first'], 'semester' => $semester];

					$results[$u]['score'] = max($results[$u]['score'], $play['perc']);
				}
			}
		}

		// If there aren't any logs throw a 404 error
		if (count($play_logs) == 0) throw new HttpNotFoundException;

		// Table headers
		$csv = "Student,ID,SIS User ID,SIS Login ID,Section,Score\r\n";

		foreach ($results as $userid => $r)
		{
			// sanitize names just in case
			$r['last_name'] = addslashes($r['last_name']);
			$r['first_name'] = addslashes($r['first_name']);
			// build row
			$csv .= "\"{$r['last_name']}, {$r['first_name']}\",\"\",$userid,\"\",\"\",\"{$r['score']}%\"\r\n";
		}

		return [$csv, '.csv'];
	}

	/**
	 * Prepares data log zip file
	 *
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	protected static function full_event_log($inst, $semesters)
	{
		// Table headers
		$csv_playlog_text = "User ID,Last Name,First Name,Play Id,Semester,Type,Item Id,Text,Value,Game Time,Created At\r\n";
		$log_count = 0;

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
			// Get all scores for each semester
			$logs = \Materia\Session_Play::get_by_inst_id($inst->id, $term, $year);

			foreach ($logs as $play)
			{
				// If there is no username, it is a guest user
				$u = $play['username'] ? $play['username'] : '(Guest)';

				if ( ! isset($results[$u])) $results[$u] = [];

				$play_events = \Materia\Session_Logger::get_logs($play['id']);

				foreach ($play_events as $play_event)
				{
					$log_count++;
					$condensed = [
						$u,
						$play['last'],
						$play['first'],
						$play['id'],
						$semester,
						$play_event->type,
						$play_event->item_id,
						str_replace(["\r","\n", ','], '', $play_event->text), // sanitize commas and newlines to keep CSV formatting intact
						$play_event->value,
						$play_event->game_time,
						$play_event->created_at
					];

					$csv_playlog_text .= implode(',', $condensed)."\r\n";
				}
			}
		}

		if ( $log_count == 0 ) return false;

		$inst->get_qset($inst->id);

		$questions = \Materia\Widget_Instance::find_questions($inst->qset->data);

		if (isset($questions[0]) && isset($questions[0]['items']))
		{
			$questions = $questions[0]['items'];
		}

		$csv_questions = [];
		$options       = [];
		$csv_answers   = [];

		foreach ($questions as $question)
		{
			foreach ($question->questions as $q)
			{
				$r                = [];
				$r['question_id'] = $question->id;
				$r['options']     = $question->options;
				$r['id']          = isset($q['id']) ? $q['id'] : '';
				$r['text']        = $q['text'];
				$csv_questions[]  = $r;
			}

			foreach ($question->options as $key => $value)
			{
				if ( ! in_array($key, $options)) $options[] = $key;
			}

			foreach ($question->answers as $answer)
			{
				$r                = [];
				$r['id']          = isset($answer['id']) ? $answer['id'] : '';
				$r['text']        = isset($answer['text']) ? $answer['text'] : '';
				$r['value']       = isset($answer['value']) ? $answer['value'] : '';
				$r['question_id'] = $question->id;
				$csv_answers[]    = $r;
			}
		}

		$csv_question_text = 'question_id,id,text';

		foreach ($options as $key)
		{
			$csv_question_text .= ",$key";
		}

		foreach ($csv_questions as $question)
		{
			// Sanitize newlines and commas, as they break CSV formatting
			$sanitized_question_text = str_replace(["\r","\n", ','], '', $question['text']);
			$csv_question_text .= "\r\n{$question['question_id']},{$question['id']},{$sanitized_question_text}";

			foreach ($options as $key)
			{
				$val = isset($question['options']) && isset($question['options'][$key]) ? $question['options'][$key] : '';

				if (is_array($val) || is_object($val))
				{
					$val = '[object]';
				}

				$csv_question_text .= ",$val";
			}
		}

		$csv_answer_text = 'question_id,id,text,value';
		foreach ($csv_answers as $answer)
		{
			// Sanitize newlines and commas, as they break CSV formatting
			$sanitized_answer_text = str_replace(["\r","\n", ','], '', $answer['text']);
			$csv_answer_text .= "\r\n{$answer['question_id']},{$answer['id']},{$sanitized_answer_text},{$answer['value']}";
		}

		$tempname = tempnam('/tmp', 'materia_raw_log_csv');

		$zip = new \ZipArchive();
		$zip->open($tempname);
		$zip->addFromString('questions.csv', $csv_question_text);
		$zip->addFromString('answers.csv', $csv_answer_text);
		$zip->addFromString('logs.csv', $csv_playlog_text);
		$zip->close();

		$data = file_get_contents($tempname);
		unlink($tempname);

		return [$data, '.zip'];
	}
	// Outputs a CSV width a widget's question and answer set
	// Does NOT care about score data of any kind
	protected static function questions_and_answers($inst, $semesters)
	{
		if ($inst == null) return false;

		$inst->get_qset($inst->id);

		$questions = \Materia\Widget_Instance::find_questions($inst->qset->data);

		$csv = [];
		$headers = "Question, Answers\r\n";

		$string = $headers;

		foreach ($questions as $question)
		{
			$sanitized_question = str_replace(["\r","\n", ','], '', $question->questions[0]['text']);
			$sanitized_answers = [];

			foreach ($question->answers as $answer)
			{
				$sanitized_answer = str_replace(["\r","\n", ','], '', $answer['text']);
				array_push($sanitized_answers, $sanitized_answer);
			}

			$string .= $sanitized_question.', '.implode(', ', $sanitized_answers)."\r\n";
		}

		return [$string, '_questions_answers.csv'];
	}

	// Outputs a .zip file of two CSV files for individual and collective referrers data
	protected static function referrer_urls($inst, $semesters)
	{
		if ($inst == null) return false;

		$inst_id = $inst->id;
		$query = \DB::select('user_id', 'referrer_url', 'created_at')
			->from('log_play')
			->where('inst_id', $inst_id);
		$data = $query->execute()->as_array();

		$headers_i = "User, URL, Date\r\n";
		$csv_i = $headers_i;

		foreach ($data as $datum_i)
		{
			$url = $datum_i['referrer_url'];
			if (strlen($datum_i['referrer_url']) < 1) $url = $inst->play_url;
			$csv_i .= $datum_i['user_id'].', '.$url.', '.$datum_i['created_at']."\r\n";
		}

		$headers_c = "URL, Count\r\n";
		$csv_c = $headers_c;

		$count = [];

		$referrer_count = [];

		foreach ($data as $datum_c)
		{
			if (array_key_exists($datum_c['referrer_url'], $referrer_count))
			{
				$referrer_count[$datum_c['referrer_url']]++;
			}
			else
			{
				$referrer_count[$datum_c['referrer_url']] = 1;
			}
		}

		foreach ($referrer_count as $url => $count)
		{
			if (strlen($url) < 1) $url = $inst->play_url;
			$csv_c .= $url.', '.$count."\r\n";
		}

		$tempname = tempnam('/tmp', 'materia_raw_log_csv');

		$zip = new \ZipArchive();
		$zip->open($tempname);
		$zip->addFromString('individual_referrers.csv', $csv_i);
		$zip->addFromString('collective_referrers.csv', $csv_c);
		$zip->close();

		$files = file_get_contents($tempname);
		unlink($tempname);

		return [$files, '_referrers.zip'];
	}
}
