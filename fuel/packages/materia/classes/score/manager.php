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
* @subpackage  scoring
* @author      ADD NAME HERE
*/

namespace Materia;

class Score_Manager
{
	/**
	 * @const int How many play logs to return details for in the
	 *             ScoreManager.getDetails() function
	 */
	const DETAILS_SIZE = 25;

	/**
	 * Returns score overview for each play the current user has for a particular instance
	 * @param int inst_id Widget Instance ID
	 * @param int play_id Play ID
	 * @return array Time sorted array of play scores containint play_id, timestamp, and score keys
	 */
	static public function get_instance_score_history($inst_id, $play_id=null)
	{
		$score_history = [];
		$instances = Api::widget_instances_get([$inst_id], false);
		if (count($instances))
		{
			$inst = $instances[0];
		}
		if ($play_id && $inst && $inst->guest_access == true)
		{
			$user_id = \Model_User::find_current_id();
			$score_history = \DB::select('id','created_at','percent')
				->from('log_play')
				->where('is_complete', '1')
				->where('id', $play_id)
				->where('inst_id', $inst_id)
				->order_by('created_at', 'DESC')
				->execute()
				->as_array();
		}
		else if (!$inst || $inst->guest_access != true)
		{
			$score_history = \DB::select('id','created_at','percent')
				->from('log_play')
				->where('is_complete', '1')
				->where('user_id', \Model_User::find_current_id())
				->where('inst_id', $inst_id)
				->order_by('created_at', 'DESC')
				->execute()
				->as_array();
		}
		return $score_history;
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

			if ($play->user_id != $curr_user_id)
			{
				if ( ! Perm_Manager::check_user_perm_to_object($curr_user_id, $play->inst_id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]))
					return new \RocketDuck\Msg('permissionDenied','Permission Denied','You do not own the score data you are attempting to access.');
			}

			// run the data through the score module
			$score_module = Score_Manager::get_score_module_for_widget($play->inst_id, $play->id);
			$score_module->logs = Session_Logger::get_logs($play->id);
			$score_module->validate_scores($play->created_at);

			// format results for the scorescreen
			$details = $score_module->get_score_report();

			$return_arr[] = $details;
		}
		return $return_arr;
	}


	/**
	 * Finds the appropriate score module instance for a given game and play log
	 *
	 * @param  int Identifier for this game instance
	 * @param  int Identifier for this play log
	 *
	 * @return Score_Modules_Base  A score module fitting the given widget
	 */
	static public function get_score_module_for_widget($inst_id, $play_id)
	{
		$inst = new Widget_Instance();
		$inst->db_get($inst_id, false);

		// note: this is REALLY REALLY DIRTY HACKISH BULLSHIT.
		// Papa-T suggests using Namespaces instead, so consider that a
		// TODO: Add namespaces so this isn't so fucking disgusting
		import(strtolower($inst->widget->score_module), '../packages/materia/vendor/widget/score_module');
		$score_module = 'Materia\Score_Modules_'.$inst->widget->score_module;

		return new $score_module($play_id, $inst);
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

	static public function get_widget_score_summary($inst_id)
	{

		// select completed scores by semester, returning the total players and the accurate average score
		$result = \DB::query("
			SELECT
				D.id,
				D.year,
				D.semester as term,
				COUNT(DISTINCT(L.user_id)) as students,
				ROUND(AVG(L.percent)) as average
			FROM
				".\DB::quote_table('log_play')." AS L
				FORCE INDEX(inst_id)
			JOIN ".\DB::quote_table('date_range')." D
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

	static public function get_preview_logs($inst_id)
	{
		// get and clear the preview log session
		$play_logs = \Session::get('previewPlayLogs.'.$inst_id);
		\Session::delete('previewPlayLogs.'.$inst_id);

		if ($play_logs == null) return $play_logs;

		// run the data through the score module
		$score_module = Score_Manager::get_score_module_for_widget($inst_id, -1);
		$score_module->logs = $play_logs;
		$score_module->validate_scores();

		// format results for the scorescreen
		$details = $score_module->get_score_report();

		return [$details];
	}

}
