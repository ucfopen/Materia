<?php
namespace Materia;

class Score_Module
{

	public $logs;
	public $inst;
	public $play_id;
	public $verified_score       = 0;
	public $calculated_percent   = 0; // Full precision percent!!  Not Rounded!
	public $total_questions      = 0;
	public $finished             = false;
	public $log_problems         = false;
	public $global_modifiers     = [];
	protected $custom_methods    = null;
	protected $questions         = [];
	protected $score_display     = [];
	protected $_ss_table_title   = 'Responses:';
	protected $_ss_table_headers = ['Question Score', 'The Question', 'Your Response', 'Correct Answer'];

	/**
	 *
	 * @param int     The play ID of the game being scored
	 * @param int     Scoring type for the game to score
	 */
	public function __construct($play_id, $inst)
	{
		$this->play_id = $play_id;
		$this->inst    = $inst;
	}

	/**
	 * Perform all validation
	 *
	 * @return boolean whether or not everything validates
	 */
	public function validate()
	{
		return $this->validate_times() && $this->validate_scores();
	}

	/**
	 * Validate that the logs we recieved make sense in time,
	 *  both in our server time and in the player time.
	 * Adds a validation fail log for every log that is found to be out of order (time-wise)
	 *
	 * @return boolean whether or not any logs were founds
	 */
	public function validate_times()
	{
		if (empty($logs)) $logs = Session_Logger::get_logs($this->play_id);
		$last_time = 0;
		if (count($logs) > 0)
		{
			foreach ($logs as $key => $log)
			{
				// this log isnt before the previous log
				if ($log->game_time < $last_time && $log->game_time != -1)
				{
					if ($this->log_problems && \RocketDuck\Util_Validator::is_valid_long_hash($this->play_id))
					{
						Session_Logger::add_log($this->play_id, Session_Log::TYPE_TIME_VALIDATION_FAILURE, $log->item_id, $log->id, $last_time, $log->game_time);
					}
				}
				$last_time = $log->game_time;
			}
			return true;
		}
		return false;
	}

	/**
	 * Calculates score for this session. Updates "verified_score" and
	 *  "calculated_percent" which are eventualy written to the database
	 *  by the API.
	 *
	 * Validates that the inividual question scores are valid.
	 *
	 * @review Needs code review
	 *
	 * @return boolean
	 */
	public function validate_scores($timestamp=false)
	{
		$this->load_questions($timestamp);

		if (empty($this->logs)) $this->logs = Session_Logger::get_logs($this->play_id);
		$this->process_score_logs();
		$this->calculate_score();

		return true;
	}

	protected final function process_score_logs()
	{
		foreach ($this->logs as $log)
		{
			switch ($log->type)
			{
				// Game end
				case Session_Log::TYPE_WIDGET_END:
					$this->finished = true;
					break;

				case Session_Log::TYPE_FINAL_SCORE_FROM_CLIENT:
					$this->handle_log_client_final_score($log);
					break;

				case Session_Log::TYPE_QUESTION_ANSWERED:
					$this->handle_log_question_answered($log);
					break;

				case Session_Log::TYPE_WIDGET_INTERACTION:
					$this->handle_log_widget_interaction($log);
					break;
			}
		}
	}

	protected function handle_log_client_final_score($log)
	{
		$this->verified_score = 0;
		$this->total_questions = 0;
		$this->global_modifiers[] = $log->value - 100;
	}

	protected function handle_log_question_answered($log)
	{
		$this->total_questions++;
		$this->verified_score += $this->check_answer($log);
	}

	protected function handle_log_widget_interaction($log)
	{
	}

	// calculate the percentage and count total points
	protected function calculate_score()
	{
		$global_mod = array_sum($this->global_modifiers);
		if ($this->total_questions > 0)
		{
			$points = $this->verified_score + $global_mod * $this->total_questions;
			$this->calculated_percent = $points / $this->total_questions;
		}
		else
		{
			$points = $this->verified_score + $global_mod;
			$this->calculated_percent = $points;
		}
		if ($this->calculated_percent < 0) $this->calculated_percent = 0;
		if ($this->calculated_percent > 100) $this->calculated_percent = 100;
	}

	public function get_score_report()
	{
		$this->score_display['overview'] = $this->get_score_overview();
		$this->score_display['details']  = $this->get_score_details();
		return $this->score_display;
	}

	protected function load_questions($timestamp=false)
	{
		if (empty($this->inst->qset->data)) $this->inst->get_qset($this->inst->id, $timestamp);
		if ( ! empty($this->inst->qset->data)) $this->questions = Widget_Instance::find_questions($this->inst->qset->data);
	}

	protected function get_score_overview()
	{
		return [
			'score' => $this->calculated_percent,
			'table' => $this->get_overview_items()
		];
	}

	protected function get_overview_items()
	{
		$overview_items   = [];
		$overview_items[] = ['message' => 'Points Lost', 'value' => $this->calculated_percent - 100];
		$overview_items[] = ['message' => 'Final Score', 'value' => $this->calculated_percent];
		return $overview_items;
	}

	protected function get_score_details()
	{
		$details = [];

		foreach ($this->logs as $log)
		{
			switch ($log->type)
			{
				case Session_Log::TYPE_QUESTION_ANSWERED:
					if (isset($this->questions[$log->item_id]))
					{
						$details[] = $this->details_for_question_answered($log);
					}
					break;
			}
		}

		// return an array of tables
		return [[
				'title'  => $this->_ss_table_title,
				'header' => $this->_ss_table_headers,
				'table'  => $details
		]];
	}

	protected function details_for_question_answered($log)
	{
		$q     = $this->questions[$log->item_id];
		$score = $this->check_answer($log);
		
		return [
			'data' => [
				$this->get_ss_question($log, $q),
				$this->get_ss_answer($log, $q),
				$this->get_ss_expected_answers($log, $q)
			],
			'data_style'    => ['question', 'response', 'answer'],
			'score'         => $score,
			'feedback'      => $this->get_feedback($log, $q->answers),
			'type'          => $log->type,
			'style'         => $this->get_detail_style($score),
			'tag'           => 'div',
			'symbol'        => '%',
			'graphic'       => 'score',
			'display_score' => true
		];
	}


	protected function get_feedback($log, $answers)
	{
		foreach ($answers as $answer)
		{
			if ($log->text == $answer['text'] && isset($answer['options']['feedback']) && strlen($answer['options']['feedback']) > 0)
			{
				return $answer['options']['feedback'];
			}
		}
	}

	protected function get_detail_style($score)
	{
		$style = '';
		switch ($score)
		{
			case -1:
			case '-1':
				$style = 'ignored-value';
				break;

			case 100:
			case '100':
				$style = 'full-value';
				break;

			case '0':
			case 0:
				$style = 'no-value';
				break;

			default:
				$style = 'partial-value';
				break;
		}
		return $style;
	}

	protected function log_problem($id, $value, $error_code, $description)
	{
		if ($this->log_problems)
		{
			Session_Logger::add_log($this->play_id, $error_code, $id, $description, $value);
		}
	}

	/**
	 * Check the answer of a given question (meant to be extended)
	 *
	 * @param Session_Log Contains information about this play session
	 *
	 * @return number the score received for this question (range: [0-100])
	 */
	abstract public function check_answer($log);


	protected function get_ss_expected_answers($log, $question)
	{
		switch ($question->type)
		{
			case 'MC':
				$max_value   = 0;
				$max_answers = [];

				// find the correct answer(s)
				foreach ($question->answers as $answer)
				{
					if ((int)$answer['value'] > $max_value)
					{
						$max_value     = (int)$answer['value'];
						$max_answers   = [];
						$max_answers[] = $answer['text'];
					}
					elseif ((int)$answer['value'] == $max_value)
					{
						$max_answers[] = $answer['text'];
					}
				}

				// display all of the correct answers
				return implode(' or ', $max_answers);

			case 'QA':
			default:
				return $question->answers[0]['text'];
		}
	}

	/**
	 * Determine what the score page should display for the user's answer
	 *
	 * @param Session_Log Contains information about this play session
	 */
	public function get_ss_answer($log, $question)
	{
		return $log->text;
	}

	public function get_ss_question($log, $question)
	{
		return $question->questions[0]['text'];
	}
}
