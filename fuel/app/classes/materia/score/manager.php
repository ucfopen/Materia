<?php
namespace Materia;

class Score_Manager
{
	/**
	 * Returns score overview for each play the current user has for a particular instance
	 * @param int inst_id Widget Instance ID
	 * @return array Time sorted array of play scores containing play_id, timestamp, and score keys
	 */
	static public function get_instance_score_history($inst_id, $context_id = null, $semester = null)
	{
		$query = \DB::select('id','created_at','percent')
			->from('log_play')
			->where('is_complete', '1')
			->where('user_id', \Model_User::find_current_id())
			->where('inst_id', $inst_id)
			->order_by('created_at', 'DESC');
		if (isset($context_id)) $query->where('context_id', $context_id);
		if (isset($semester)) $query->where('semester', $semester);
		return $query->execute()
			->as_array();
	}

	/**
	 * Returns score overview for a particular play for guests
	 * @param int inst_id Widget Instance ID
	 * @param int play_id Play ID
	 * @return array Single item array of play scores containing play_id, timestamp, and score keys
	 */
	static public function get_guest_instance_score_history($inst_id, $play_id)
	{
		return \DB::select('id','created_at','percent')
			->from('log_play')
			->where('is_complete', '1')
			->where('id', $play_id)
			->where('inst_id', $inst_id)
			->order_by('created_at', 'DESC')
			->execute()
			->as_array();
	}

	/**
	* Returns any additional "bonus" attempts granted to the user for a particular instance
	* @param string inst_id Widget Instance ID
	* @param string user_id User ID
	* @return int number of extra attempts granted to the user for that instance, or 0
	*/
	static public function get_instance_extra_attempts($inst_id, $user_id, $context_id, $semester)
	{
		$result = \DB::select('extra_attempts')
			->from('user_extra_attempts')
			->where('user_id', $user_id)
			->where('inst_id', $inst_id)
			->where('context_id', $context_id)
			->where('semester', $semester)
			->execute()
			->as_array();

		return count($result) ? $result[0]['extra_attempts'] : 0;
	}

	/**
	 * Get Score and Play Details by play_ids
	 * @param array play_ids Array of play_id's to get
	 * @return array Returns a crazy array of details for each requested play_id
	 */
	static public function get_play_details($play_ids)
	{
		$curr_user_id = \Model_User::find_current_id();
		/* Gather data for each one of these plays */
		$return_arr = [];

		foreach ($play_ids as $play_id)
		{
			$play = new Session_Play();
			$play->get_by_id($play_id);
			$inst_id = $play->inst_id;
			$instances = Api::widget_instances_get([$inst_id], false);
			if ( ! count($instances)) throw new HttpNotFoundException;
			$inst = $instances[0];

			if ($play->user_id != $curr_user_id && ! $inst->allows_guest_players())
			{
				if ( ! Perm_Manager::user_has_any_perm_to($curr_user_id, $play->inst_id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]))
					return new \Materia\Msg('permissionDenied','Permission Denied','You do not own the score data you are attempting to access.');
			}

			// run the data through the score module
			$class = $inst->widget->get_score_module_class();
			$score_module = new $class($play->id, $inst, $play);
			$score_module->logs = Session_Logger::get_logs($play->id);
			$score_module->validate_scores($play->created_at);

			// format results for the scorescreen
			$details = $score_module->get_score_report();

			$return_arr[] = $details;
		}
		return $return_arr;
	}

	/**
	 * Returns an object that contains the score distribution total and by semester of scores
	 * Distributions are split into groups of 10, so [0] is for  scores 0-9, [1] is 10-19, etc.
	 * The last category, 9, represents scores of 90-100.  Also includes a total of all semesters.
	 *
	 * @param  int Identifier for this game instance
	 *
	 * @return Object  A complex object, which looks as follows:
	 * 		{
	 * 			total: [10],
	 * 			semesters: [
	 * 				{
	 * 					name: 'Summer 2011',
	 * 					distribution: Array(10)
	 * 				}, ...
	 * 			]
	 * 		}
	 */
	static public function get_widget_score_distribution($inst_id)
	{
		// select the number of 0-9 scores (0), 10-11 scores (1), etc... for each semester, ordered by semester
		// note that 100s are lumped into the "9" bracket (90-100)
		// This query does not reduce the scores to the top score for each user
		// ... it uses every score for completed plays
		$result = \DB::query(
			'SELECT
				D.id,
				D.year,
				D.semester as term,
				COUNT(*) AS players,
				FLOOR( IF(P.percent = 100, 99, P.percent) / 10) bracket
			FROM '.\DB::quote_table('log_play').' P
			LEFT JOIN '.\DB::quote_table('date_range').' D
				ON P.created_at BETWEEN D.start_at AND D.end_at
			WHERE P.inst_id = :inst_id
			AND P.is_complete = \'1\'
			GROUP BY D.id, bracket
			ORDER BY start_at DESC
			', \DB::SELECT)
			->param('inst_id', $inst_id)
			->execute()
			->as_array();

		// we have to post process this query O(n)
		$semesters = [];
		foreach ($result as $log)
		{
			$key = $log['id'];
			if ( ! isset($semesters[$key]))
			{
				$semesters[$key] = [
					'id'     => (int)$log['id'],
					'year'     => $log['year'],
					'term'     => $log['term'],
					'distribution' => array_fill(0, 10, 0),
				];
			}
			$semesters[$key]['distribution'][$log['bracket']] = (int) $log['players'];
		}

		return $semesters;
	}

	static public function get_widget_scores_for_semester($inst_id, $semester)
	{
		return \DB::select('id', 'created_at', 'score')
			->from('log_play')
			->where('is_complete', '1')
			->where('inst_id', $inst_id)
			->where('semester', $semester)
			->execute()
			->as_array();
	}
	static public function get_all_widget_scores($inst_id)
	{
		// returns randomly-sorted list of all scores for widget
		return \DB::select('id','created_at','score')
			->from('log_play')
			->where('is_complete', '1')
			->where('inst_id', $inst_id)
			->execute()
			->as_array();
	}

	static public function get_widget_score_summary($inst_id)
	{

		// select completed scores by semester, returning the total players and the accurate average score
		$result = \DB::query('
			SELECT
				D.id,
				D.year,
				D.semester as term,
				COUNT(DISTINCT(L.user_id)) as students,
				ROUND(AVG(L.percent)) as average
			FROM
				'.\DB::quote_table('log_play').' AS L
				FORCE INDEX(inst_id)
			JOIN '.\DB::quote_table('date_range')." D
				ON L.created_at BETWEEN D.start_at AND D.end_at
			WHERE L.inst_id = :inst_id
			AND L.`is_complete` = '1'
			GROUP BY D.id
		", \DB::SELECT)
			->param('inst_id', $inst_id)
			->execute()
			->as_array();

		// we need to process the result to turn this into an object
		$return = [];
		foreach ($result as $table)
		{
			// TODO: this seems a little redundant no?
			$return[$table['id']] = [
				'id'       => (int)$table['id'],
				'term'     => $table['term'],
				'year'     => $table['year'],
				'students' => $table['students'],
				'average'  => $table['average']
			];
		}

		return $return;
	}

	static public function save_preview_logs($inst_id, $raw_logs)
	{
		// append to any previously stored logs
		$logs = \Session::get('previewPlayLogs.'.$inst_id, []);

		foreach ($raw_logs as $log)
		{
			$type      = isset($log->type) ? Session_Logger::get_type($log->type) : 0;
			$item_id   = isset($log->item_id) ? $log->item_id : 0;
			$text      = isset($log->text) ? $log->text : '';
			$value     = isset($log->value) ? $log->value : '';
			$game_time = isset($log->game_time) ? $log->game_time : '';

			$new_log = Session_Logger::add_log(-1, $type, $item_id, $text,  $value, $game_time, time());
			$logs[] = $new_log;
		}

		\Session::set('previewPlayLogs.'.$inst_id, $logs);
	}

	static public function init_preview($inst_id)
	{
		\Session::set('previewPlayLogs.'.$inst_id, []);
	}

	static public function get_preview_logs($inst)
	{
		// get and clear the preview log session
		$play_logs = \Session::get('previewPlayLogs.'.$inst->id);
		\Session::delete('previewPlayLogs.'.$inst->id);

		if ($play_logs == null) return $play_logs;

		// run the data through the score module
		$class = $inst->widget->get_score_module_class();
		$score_module = new $class(-1, $inst);
		$score_module->logs = $play_logs;
		$score_module->validate_scores();

		// format results for the scorescreen
		$details = $score_module->get_score_report();

		return [$details];
	}

}
