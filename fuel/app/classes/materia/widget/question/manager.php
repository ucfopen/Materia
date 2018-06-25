<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */
namespace Materia;

class Widget_Question_Manager
{
	/**
	 * Gets the questions available to the given user ID with the
	 * given types (passed as an array)
	 *
	 * @param int $user_id The ID of the user to get questions for
	 * @param string|array $q_type The types of questions to get
	 *
	 * @return array|object An array of questions available to the user for the given types
	 */
	static public function get_users_questions($user_id, $q_type=null)
	{
		//q_type is a urlencoded string containing the types of questions to search for
		$q_type = urldecode($q_type);
		$q_type = str_replace('Question/Answer', 'QA', $q_type);
		$q_type = str_replace('Multiple Choice', 'MC', $q_type);

		$q_type = explode(',', $q_type);

		$cache_key = empty($q_type) ? 'all' : implode('', $q_type);

		$q_list = \Cache::easy_get('questions.user-'.$user_id.'.'.$cache_key);

		if (is_null($q_list))
		{
			$q = \DB::select()
				->from('question')
				->where('user_id', $user_id);

			// if qtype array is sent, add to the where
			if ( ! empty($q_type) && is_array($q_type))
			{
				$q->where('type', 'IN', $q_type);
			}
			$results = $q->execute();

			$q_list = [];
			// Loop through the questions
			foreach ($results as $r)
			{
				//get the number of uses for each question
				$uses_q = \DB::select([\DB::expr('COUNT(*)'), 'count'])
					->from('map_question_to_qset')
					->where('question_id', (int) $r['id'])
					->execute();

				$uses = $uses_q[0]['count'];

				// store the data for the objct to be returned.
				$q_list[] = [
					'id'   => (int) $r['id'],
					'type' => $r['type'],
					'text' => $r['text'],
					'uses' => $uses,
					'created_at' => (int) $r['created_at']
				];
			}

			\Cache::set('questions.user-'.$user_id.'.'.$cache_key, $q_list);
		}

		return $q_list;
	}
}
