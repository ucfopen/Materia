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
 * Manages export functionality for any given module (inst).
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  scoring
 * @category    Modules
  * @author      ADD NAME HERE
 */

namespace Materia;

abstract class Export_Module
{
	public $inst;

	/**
	 * This is the base export module extended by each widget to include custom log exporting options.
	 * Each method in this class:
	 *		- must accept semesters_string as the sole parameter
	 *		- must return an array as follows:
	 *			[<the payload>, (string) <the file type being output, including dot .>]
	 *
	 *			example: 
	 *			[$var_holding_data, ".csv"]
	 *
	 *
	 * @param int     The play ID of the game being scored
	 * @param int     Scoring type for the game to score
	 */
	public function __construct($inst)
	{
		$this->inst    = $inst;
	}

	/**
	 * Prepares and then pushes a csv file
	 *
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	public function csv($semesters_string)
	{
		$semesters = explode(',', $semesters_string);
		$play_logs = [];
		$results   = [];


		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
			// Get all scores for each semester
			$logs = $play_logs[$year.' '.$term] = \Materia\Session_Play::get_by_inst_id($this->inst->id, $term, $year);

			foreach ($logs as $play)
			{
				$uname = $play['username'];

				// Only report actual user scores, no guests
				if ($uname)
				{
					if ( ! isset($results[$uname])) $results[$uname] = ['score' => 0];

					$results[$uname]['semester']   = $semester;
					$results[$uname]['last_name']  = $play['last'];
					$results[$uname]['first_name'] = $play['first'];
					$results[$uname]['score']      = max($results[$uname]['score'], $play['perc']);
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

		return array($csv, ".csv");
	}

	/**
	 * Prepares and then pushes a csv file
	 *
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	public function raw($semesters_string)
	{
		$semesters = explode(',', $semesters_string);
		$play_logs = [];
		$results   = [];

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
			// Get all scores for each semester
			$logs = $play_logs[$year.' '.$term] = \Materia\Session_Play::get_by_inst_id($this->inst->id, $term, $year);

			foreach ($logs as $play)
			{
				// If there is no username, it is a guest user
				$uname = $play['username'] ? $play['username'] : "(Guest)";

				if ( ! isset($results[$uname])) $results[$uname] = ['score' => 0];

				$play_events = \Materia\Session_Logger::get_logs($play['id']);

				foreach ($play_events as $play_event)
				{
					$r = [];
					$r['semester']   = $semester;
					$r['last_name']  = $play['last'];
					$r['first_name'] = $play['first'];
					$r['playid']     = $play['id'];
					$r['type']       = $play_event->type;
					$r['item_id']	 = $play_event->item_id;
					$r['text']       = $play_event->text;
					$r['value']      = $play_event->value;
					$r['game_time']  = $play_event->game_time;
					$r['created_at'] = $play_event->created_at;
					$results[$uname][] = $r;
				}
			}
		}

		// If there aren't any logs throw a 404 error
		if (count($play_logs) == 0) throw new HttpNotFoundException;

		// Table headers
		$csv_playlog_text = "User ID,Last Name,First Name,Play Id,Semester,Type,Item Id,Text,Value,Game Time,Created At\r\n";

		foreach ($results as $userid => $userlog)
		{
			foreach ($userlog as $r)
			{
				$csv_playlog_text .= "$userid,{$r['last_name']},{$r['first_name']},{$r['playid']},{$r['semester']},{$r['type']},{$r['item_id']},{$r['text']},{$r['value']},{$r['game_time']},{$r['created_at']}\r\n";
			}
		}

		$this->inst->get_qset($this->inst->id);

		$questions = \Materia\Widget_Instance::find_questions($this->inst->qset->data);

		if (isset($questions[0]) && isset($questions[0]['items']))
		{
			$questions = $questions[0]['items'];
		}

		$csv_answers = [];
		$csv_questions = [];
		$options = [];

		foreach ($questions as $question)
		{
			foreach ($question->questions as $q)
			{
				$csv_question = [];
				$csv_question['question_id'] = $question->id;
				$csv_question['id'] = isset($q['id']) ? $q['id'] : '';
				$csv_question['options'] = $question->options;
				$csv_question['text'] = $q['text'];
				$csv_questions[] = $csv_question;
			}

			foreach ($question->options as $key => $value)
			{
				if ( ! in_array($key, $options))
				{
					$options[] = $key;
				}
			}

			foreach ($question->answers as $answer)
			{
				$csv_answer = [];
				$csv_answer['id'] = isset($answer['id']) ? $answer['id'] : '';
				$csv_answer['text'] = isset($answer['text']) ? $answer['text'] : '';
				$csv_answer['value'] = isset($answer['value']) ? $answer['value'] : '';
				$csv_answer['question_id'] = $question->id;
				$csv_answers[] = $csv_answer;
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

		$tempname = tempnam('/tmp', 'materia_csv');

		$zip = new \ZipArchive();
		$zip->open($tempname);
		$zip->addFromString('questions.csv', $csv_question_text);
		$zip->addFromString('answers.csv', $csv_answer_text);
		$zip->addFromString('logs.csv', $csv_playlog_text);
		$zip->close();

		$data = file_get_contents($tempname);
		unlink($tempname);

		return array($data, ".zip");
	}
}
