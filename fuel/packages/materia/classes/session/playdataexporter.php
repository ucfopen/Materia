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

	// EX: $play_data = new \Materia\Session_PlayDataExporter($crossword_instance);
	// list($data, $file_extension) = $play_data->export('My Special Method', $semester);
	// this calls the method defined in packages/materia/vendor/widget/12-crossword/playdata_exporters.php
	// playdata_exports.php: <? return ['My Special Method' => function($inst, $semesters){ return ['no data', '.csv'];}];
	public function export($unclean_name, $semesters_string)
	{
		$name = static::scrub_method_name($unclean_name);
		$semesters = explode(',', $semesters_string);

		// try a class methods
		if (method_exists($this, $name)) return static::$name($this->inst, $semesters);

		// try custom methods
		$this->load_custom_methods();

		if ( ! array_key_exists($name, $this->custom_methods)) throw new \RuntimeException("Method {$unclean_name} does not exist");

		return $this->custom_methods[$name]($this->inst, $semesters);
	}

	protected function load_custom_methods($force = false)
	{
		// binds custom methods only if they are needed
		if ( ! $this->custom_methods_bound || $force)
		{
			$wgt_methods = $this->inst->widget->load_widget_methods('playdata_exporters');
			foreach ($wgt_methods as $name => $method)
			{
				$this->custom_methods[static::scrub_method_name($name)] = $method;
			}
			$this->custom_methods_bound = true;
		}
	}

	protected static function scrub_method_name($name)
	{
		return \Inflector::friendly_title($name, '_', true);
	}

	protected static function storage($inst, $semesters)
	{
		$table_name   = \Input::get('table');
		$num_records  = 0;
		$storage_data = [];
		$csv          = '';

		if (empty($table_name)) throw new \Exception('Missing required storage table name');

		// load the logs for all selected semesters
		if (empty($semesters))
		{
			$loaded_data = Storage_Manager::get_storage_data($inst->id, '', '', $table_name);
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
				$loaded_data = Storage_Manager::get_storage_data($inst->id, $year, $term, $table_name);
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
		$csv = "User ID,Last Name,First Name,Score,Semester\r\n";

		foreach ($results as $userid => $r)
		{
			$csv .= "$userid,{$r['last_name']},{$r['first_name']},{$r['score']},{$r['semester']}\r\n";
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
		$results   = [];

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
					$r               = [];
					$r['last_name']  = $play['last'];
					$r['first_name'] = $play['first'];
					$r['playid']     = $play['id'];
					$r['semester']   = $semester;
					$r['type']       = $play_event->type;
					$r['item_id']    = $play_event->item_id;
					$r['text']       = $play_event->text;
					$r['value']      = $play_event->value;
					$r['game_time']  = $play_event->game_time;
					$r['created_at'] = $play_event->created_at;
					$results[$u][]   = $r;
				}
			}
		}

		if ( ! count($results)) return false;

		// Table headers
		$csv_playlog_text = "User ID,Last Name,First Name,Play Id,Semester,Type,Item Id,Text,Value,Game Time,Created At\r\n";

		foreach ($results as $userid => $userlog)
		{
			foreach ($userlog as $r)
			{
				$csv_playlog_text .= "$userid,{$r['last_name']},{$r['first_name']},{$r['playid']},{$r['semester']},{$r['type']},{$r['item_id']},{$r['text']},{$r['value']},{$r['game_time']},{$r['created_at']}\r\n";
			}
		}

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
			$csv_question_text .= "\r\n{$question['question_id']},{$question['id']},{$question['text']}";

			foreach ($options as $key)
			{
				$val = isset($question['options']) && isset($question['options'][$key]) ? $question['options'][$key] : '';
				$csv_question_text .= ",$val";
			}
		}

		$csv_answer_text = 'question_id,id,text,value';
		foreach ($csv_answers as $answer)
		{
			$csv_answer_text .= "\r\n{$answer['question_id']},{$answer['id']},{$answer['text']},{$answer['value']}";
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

}
