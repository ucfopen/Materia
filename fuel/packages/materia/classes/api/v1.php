<?
/**
 * Materia
 * It's a thing
 *
 * @package    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */
/*
======================= API NAMING CONVETION =======================
The goals of the naming convention are to have a short, descriptive, and predictable name
for each function that will sort related functions near one another alphabetically
- Camel Case
- Lower Case First letter
- No Spaces
- Noun First
- Verb Last
- Use a underscore between the item and the verb
EX: gameInstance_get, gameInstance_create, gameInstance_edit, gameInstance_copy
Availible Verbs:
- get   	(retrive a value)
- create	(create/save a new value)
- delete	(remove a value)
- edit  	(update a value)
- copy  	(duplicate a value)
- do    	(action when the above verbs dont fit)
- Other verbs can be used, but only when the above do not fit
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
class Api_V1
{
	/**
	 * Finds widgets that are specified in the database as spotlight widgets.
	 * @param array $widgets
	 * @return mixed
	 *
	 */
	static public function widgets_get($widgets = null)
	{
		return Widget_Manager::get_widgets($widgets);
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	// TODO: this should hit widget_instance_manager::getInstances() with optional arguments
	static public function widget_instances_get($inst_ids = null)
	{
		if ( ! isset($inst_ids))
		{
			// ==================== GET ALL INSTANCES ==============================
			if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
			return Widget_Instance_Manager::get_all_for_user(\Model_User::find_current_id());
		}
		else
		{
			// ==================== CHECK FOR SPECIFIC INSTANCES ==================
			// convert string into array of items
			if ( ! empty($inst_ids)) $inst_ids = [$inst_ids];
			return Widget_Instance_Manager::get_all($inst_ids);
		}
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @return bool, true if successfully deleted widget instance, false otherwise.
	 * @TODO push the majority of this code into GameManager
	 */
	static public function widget_instance_delete($inst_id)
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) != true) return \RocketDuck\Msg::invalid_input($inst_id);
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		if ($inst = Widget_Instance_Manager::get($inst_id)) return $inst->db_remove();
		return false;
	}
	/**
	 * Make a copy of the given game
	 *
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @review Needs code review
	 */
	static public function widget_instance_copy($inst_id, $new_name)
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		// get the qset
		$inst = new Widget_Instance();
		$inst->db_get($inst_id, true);
		$duplicate = $inst->duplicate($new_name);
		return $duplicate->id;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param int     $widget_id The Game resource ID
	 * @param object  $qset
	 * @param bool    $is_draft Whether the widget is being saved as a draft
	 * @param int     $inst_id (optional) The id of the game (widget) we're saving
	 *
	 * @return array An associative array with details about the save
	 */

	static public function widget_instance_save($widget_id=null, $name=null, $qset=null, $is_draft=null){ return static::widget_instance_new($widget_id, $name, $qset, $is_draft); }
	static public function widget_instance_new($widget_id=null, $name=null, $qset=null, $is_draft=null)
	{
		if (\Model_User::verify_session(['basic_author','super_user']) !== true) return \RocketDuck\Msg::no_login();
		if ( ! \RocketDuck\Util_Validator::is_pos_int($widget_id)) return \RocketDuck\Msg::invalid_input($widget_id);
		if ( ! is_bool($is_draft)) $is_draft = true;

		$widget = new Widget();
		if ( $widget->get($widget_id) == false) return \RocketDuck\Msg::invalid_input('Invalid widget type');

		// init the instance
	 	$inst = new Widget_Instance([
			'user_id'    => \Model_User::find_current_id(),
			'name'       => $name,
			'is_draft'   => $is_draft,
			'created_at' => time(),
			'widget'     => $widget
		]);

		if ($qset !== null)
		{
			if ( ! empty($qset->data)) $inst->qset->data = $qset->data;
			if ( ! empty($qset->version)) $inst->qset->version = $qset->version;
		}

		// save
		if ($inst->db_store()) return $inst;
	}

	/**
	 * Save and existing instance
	 *
	 * @param int     $inst_id
	 * @param object  $qset
	 * @param bool    $is_draft Whether the widget is being saved as a draft
	 * @param int     $open_at
	 * @param int     $close_at
	 * @param int     $attempts
	 *
	 * @return array An associative array with details about the save
	 */
	static public function widget_instance_update($inst_id=null, $name=null, $qset=null, $is_draft=null, $open_at=null, $close_at=null, $attempts=null)
	{
		if (\Model_User::verify_session(['basic_author','super_user']) !== true) return \RocketDuck\Msg::no_login();
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id)) return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'Instance id is invalid');
		$perms = Perm_Manager::get_user_object_perms($inst_id, Perm::INSTANCE, \Model_User::find_current_id());
		if ($perms[Perm::FULL] != 1 && $perms[Perm::VISIBLE] != 1 ) return \RocketDuck\Msg::no_perm();

		// load the existing qset
		$inst = new Widget_Instance();
		$loaded = $inst->db_get($inst_id);
		if ( ! $loaded) return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'Widget instance could not be found.');

		// update the widget type (some can change based on theme)
		if ($qset !== null && ! empty($qset->data) && ! empty($qset->version)) $inst->qset = $qset;
		if ( ! empty($name)) $inst->name = $name;
		if ($is_draft !== null) $inst->is_draft = $is_draft;
		if ($open_at !== null) $inst->open_at = $open_at;
		if ($close_at !== null) $inst->close_at = $close_at;
		if ($attempts !== null) $inst->attempts = $attempts;

		// save
		if ($inst->db_store())
		{
			return $inst;
		}
		else
		{
			return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'Widget could not be created.');
		}
	}
	/**
	 * Try and get a lock on the given game
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * NEEDS DOCUMENTATION
	 */
	static public function widget_instance_lock($inst_id) // formerly $inst_id
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		// getDraftLock will return true if we have or are able to get a lock on this game
		return Widget_Instance_Manager::lock($inst_id);
	}
	/**
	 * Finds widgets that are specified in the database as spotlight widgets.
	 *
	 * @param object The Database Manager
	 *
	 * @return array The widgets that are marked as spotlight.
	 */
	static public function widget_spotlight_get()
	{
		$dir = PUBPATH.'assets/spotlight/';
		$files = \File::read_dir($dir);
		$spotlight_list = [];
		foreach ($files as $file)
		{
			$spotlight_list[] = \File::read($dir.$file, true);
		}

		return $spotlight_list;
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param bool NEEDS DOCUMENTATION
	 * @return array
	 */
	static public function session_play_create($inst_id, $preview_mode=false)
	{
		$user = \Model_User::find_current();
		$instances = static::widget_instances_get([$inst_id], false);
		if ( ! count($instances)) throw new HttpNotFoundException;

		$inst = $instances[0];
		if (! Perm_Manager::can_play($user, $inst)) return \RocketDuck\Msg::no_login();
		// make sure the user has ownership permissions to preview the widget
		if ($preview_mode)
		{
			// check to see if they have the SSO punch through for this inst_id
			if ( ! (in_array($inst_id, \Session::get('allowSSOPreviewMode', []))))
			{
				$perms = Perm_Manager::get_user_object_perms($inst_id, Perm::INSTANCE, \Model_User::find_current_id());
				if ($perms[Perm::FULL] != 1 && $perms[Perm::VISIBLE] != 1 ) return \RocketDuck\Msg::no_perm();
			}
		}

		$inst = new Widget_Instance();
		if ($inst->db_get($inst_id))
		{
			if ($preview_mode == false && $inst->is_draft == true) return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'Drafts Not Playable', 'Must use Preview to play a draft.');
			$play = new Session_Play();
			$play_id = $play->start(\Model_User::find_current_id(), $inst_id, $preview_mode);
			return $play_id;
		}

		// the game instance didn't exist, return an error
		return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR,'Invalid Login', 'The game your attempting to reach no longer exists.');
	}

	/**
	 * NEEDS DOCUMENTATION
	 */
	static public function session_logout()
	{
		$activity = new Session_Activity([
			'user_id' => \Model_User::find_current_id(),
			'type'    => Session_Activity::TYPE_LOGGED_OUT
		]);
		$activity->db_store();
		return \Auth::logout();
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function session_login($user, $pass)
	{
		// input is sanitized in the authentication modules
		return \Model_User::login($user, $pass);
	}

	/**
	 * Verifies that the user has a current session and generates a new SESSID for them
	 *
	 * @param string NEEDS DOCUMENTATION
	 *
	 * @return bool true if user is logged in, false if not
	 */
	static public function session_valid($role_name = null, $update_timeout = true)
	{
		return \Model_User::verify_session($role_name, $update_timeout);
	}

	/**
	 *
	 * Get play activity history based on user's user_id
	 *
	 */
	static public function play_activity_get($start = 0, $range = 6)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		// get play data, ask for one more than was requested so we can see if there are more
	 	// we grabbed an extra entry, just to see if there are more than requested
	 	// but we don't want to include that in the results
		$play  = new Session_Play();
	 	$plays = $play->get_plays_by_user_id(\Model_User::find_current_id(), $start, $range + 1);
	 	$count = count($plays);
	 	if ($count > $range) $plays = array_slice($plays, 0, $range);
	 	return [
	 		'activity' => $plays,
	 		'more'     => $count > $range
	 	];
	}

	static public function play_logs_save($play_id, $logs, $preview_inst_id = null)
	{
		$play = new Session_Play();
		$user = \Model_User::find_current();
		$play->get_by_id($play_id);
		$inst_id = $play->inst_id;
		$instances = static::widget_instances_get([$inst_id], false);
		$inst = $instances[0];
		if ( ! count($instances)) throw new HttpNotFoundException;

		$can_play = Perm_Manager::can_play($user, $inst);

		if (! $can_play) return \RocketDuck\Msg::no_login();
		if ( $preview_inst_id === null && ! \RocketDuck\Util_Validator::is_valid_long_hash($play_id)) return \RocketDuck\Msg::invalid_input($play_id);
		if ( ! is_array($logs) || count($logs) < 1 ) return \RocketDuck\Msg::invalid_input('missing log array');

		// ============ PREVIEW MODE =============
		if (\RocketDuck\Util_Validator::is_valid_hash($preview_inst_id))
		{
			Score_Manager::save_preview_logs($preview_inst_id, $logs);
			return true;
		}
		// ============ PLAY FOR KEEPS ===========
		else
		{
			$play = self::_validate_play_id($play_id);
			if ( ! ($play instanceof Session_Play)) return \RocketDuck\Msg::invalid_input('Invalid play session');
			// each log is an object?, convert to array
			if ( ! is_array($logs[0]))
			{
				$len = count($logs);
				for ($i = 0; $i < $len; $i++)
				{
					$logs[$i] = (array)($logs[$i]);
				}
			}

			Session_Logger::parse_and_store_log_array($play_id, $logs);
			$score_mod = Score_Manager::get_score_module_for_widget($play->inst_id, $play_id);
			$score_mod->log_problems = true;
			// make sure that the logs arent timestamped wrong or recieved incorrectly
			if ($score_mod->validate_times() == false)
			{
				$play->invalidate();
				return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'Timing validation error.', true);
			}

			// validate the scores the game generated on the server
			if ($score_mod->validate_scores() == false)
			{
				$play->invalidate();
				return new \RocketDuck\Msg(\RocketDuck\Msg::ERROR, 'There was an error validating your score.', true);
			}

			$return = [];

			if ($score_mod->finished == true)
			{
				$play->set_complete($score_mod->verified_score, $score_mod->total_questions, $score_mod->calculated_percent);

				$event_returns = \Event::trigger('play_completed', $play, 'array');

				foreach ($event_returns as $event_return_arr)
				{
					$return = array_merge($return, $event_return_arr);
				}
			}

			$return['score'] = $score_mod->calculated_percent;

			return $return;
		}
	}

	static public function assets_get()
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		return Widget_Asset_Manager::get_assets_by_user(\Model_User::find_current_id(), Perm::FULL);
	}

	static public function widget_instance_scores_get($inst_id)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) != true) return \RocketDuck\Msg::invalid_input($inst_id);
		return Score_Manager::get_instance_score_history($inst_id);
	}

	static public function widget_instance_play_scores_get($play_id, $preview_mode_inst_id = null)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		if (\RocketDuck\Util_Validator::is_valid_hash($preview_mode_inst_id))
		{
			return Score_Manager::get_preview_logs($preview_mode_inst_id);
		}
		else
		{
			if (\RocketDuck\Util_Validator::is_valid_long_hash($play_id) != true) return \RocketDuck\Msg::invalid_input($play_id);
			return Score_Manager::get_play_details([$play_id]);
		}
	}
	/**
	 *	Gets scores/players for a particular game
	 *	Returns an array with the following:
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @review Needs code review
	 *
	 *	@return array [players]     a list of players that played this game <br />
	 *				  [quickStats]	contains attempts, scores, currentPlayers, avScore, replays <br />
	 *				  [playLogs]    a log of all scores recoreded
	 */
	static public function play_logs_get($inst_id, $semester = 'all', $year = 'all')
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) != true) return \RocketDuck\Msg::invalid_input($inst_id);
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		if ( ! Perm_Manager::check_user_perm_to_object(\Model_User::find_current_id(), $inst_id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL])) return \RocketDuck\Msg::no_perm();
		return Session_Play::get_by_inst_id($inst_id, $semester, $year);
	}
	/**
	 * Gets score distributions (total and by semester) for a widget instance.
	 * See documentation in Score_Manager for more information.
	 */
	static public function score_summary_get($inst_id, $include_storage_data = false)
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) != true) return \RocketDuck\Msg::invalid_input($inst_id);
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		$distribution = Score_Manager::get_widget_score_distribution($inst_id);
		$summary = Score_Manager::get_widget_score_summary($inst_id);
		foreach ($distribution as $id => $data)
		{
			if ( ! array_key_exists($id, $summary))
			{
				$summary[$id] = $data;
			}
			else
			{
				$summary[$id]['distribution'] = $data['distribution'];
			}
		}
		if ($include_storage_data)
		{
			$storage = Storage_Manager::get_table_summaries_by_inst_id($inst_id);
			foreach ($storage as $id => $data)
			{
				if ( ! array_key_exists($id, $summary))
				{
					$summary[$id] = $data;
					$summary[$id]['storage'] = $summary[$id]['data'];
					unset($summary[$id]['data']);
				}
				else
				{
					$summary[$id]['storage'] = $data['data'];
				}
			}
		}
		$summary = array_values($summary);
		// we want to be sure that the client can rely on the array order
		usort($summary, function($a, $b) {
			return($a['id'] < $b['id']);
		});
		return $summary;
	}
	/**
	 * Gets the Question Set for the widget with the given instance ID.
	 * Current user must have author/collab access to the widget or
	 * a valid play ID for this to work.
	 * @notes users that are logged in and already have a valid play ID have already passed access test, so no need to try again
	 * NEEDS DOCUMENTATION
	 */
	static public function play_storage_get($inst_id)
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id) ) return \RocketDuck\Msg::invalid_input($inst_id);
		return Storage_Manager::get_logs_by_inst_id($inst_id);
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param int $inst_id The id of the widget instance to get the qset for (formerly inst_id)
	 * @param int $play_id The play id associated with a play session
	 * @return object
	 */
	static public function question_set_get($inst_id, $play_id = null)
	{
		$user = \Model_User::find_current();
		$instances = static::widget_instances_get([$inst_id], false);
		if ( ! count($instances)) throw new HttpNotFoundException;

		$inst = $instances[0];
		$can_play = Perm_Manager::can_play($user, $inst);
		if (! $can_play) return \RocketDuck\Msg::no_login();
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) === false) return \RocketDuck\Msg::invalid_input($inst_id);
		// play id sent, send the user the qset if the play is valid
		if ($play_id)
		{
			//valid play id
			if (Api_V1::_validate_play_id($play_id))
			{
				$inst = new Widget_Instance();
				$inst->db_get($inst_id, true);
				if ($inst->widget->is_qset_encrypted && \Config::get('materia.security.encrypt_qsets') === true)
				{
					return ['encryptedText' => \Event::trigger('Materia.encrypt', $inst->qset)];
				}
				else
				{
					return $inst->qset;
				}
			}
			// invalid play
			else
			{
				return \RocketDuck\Msg::no_login();
			}
		}
		// no play id, check user's permissions to the game instance - this is probably for previewing
		else
		{
			if ( ! Perm_Manager::check_user_perm_to_object(\Model_User::find_current_id(), $inst_id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]) && ! $can_play) return \RocketDuck\Msg::no_perm();
			$inst = new Widget_Instance();
			$inst->get_qset($inst_id); // get the instance and dig into it
			return $inst->qset;
		}
	}
	/**
	 * Gets the question with the given QID or an array of questions
	 * with the given ids (passed as an array)
	 *
	 * @param int|array $ids The Question ID or IDs of the questions to get.
	 *
	 * @return array|object An array of questions requested or a question requested
	 */
	static public function questions_get($ids=null, $type=null) // remote_getQuestions
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		// get specific questions
		if ($ids)
		{
			if ( ! is_array($ids)) return \RocketDuck\Msg::invalid_input($ids);
			$questions = [];
			foreach ($ids as $id)
			{
				if ($question = Widget_Question::forge()->db_get($id))
				{
					$questions[] = $question;
				}
			}
			return $questions;
		}
		// get all my questions
		else
		{
			return Widget_Question_Manager::get_users_questions(\Model_User::find_current_id(), $type);
		}
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @review Needs code review.
	 */
	static public function play_storage_data_save($play_id, $data)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		if ($play = Api_V1::_validate_play_id($play_id)) //valid play id or logged in
		{
			Storage_Manager::parse_and_store_storage_array($play->inst_id, $play_id, $play->user_id, $data);
			return true;
		}
		else
		{
		 	return \RocketDuck\Msg::no_login();
		}
	}
	/**
	 * NEEDS DOCUMENTATION
	 */
	static public function play_storage_data_get($inst_id, $format=null) // formerly $inst_id
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id) != true) return \RocketDuck\Msg::invalid_input($inst_id);
		switch ($format)
		{
			case 'csv':
				return Storage_Manager::get_csv_logs_by_inst_id($inst_id);

			default:
				return Storage_Manager::get_logs_by_inst_id($inst_id);
		}
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function semester_date_ranges_get()
	{
		return Utils::get_date_ranges();
	}

	static public function users_search($search)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();

		$user_objects = \Model_User::find_by_name_search($search);
		$user_arrays = [];

		// scrub the user models with to_array
		if (count($user_objects))
		{
			foreach ($user_objects as $key => $person)
			{
				$user_arrays[$key] = $person->to_array();
			}
		}

		return $user_arrays;
	}
	/**
	 * Gets information about the current user
	 *
	 * @return object   User object
	 * @return bool     False if error or no login
	 */
	static public function user_get($user_ids = null)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();

		//no user ids provided, return current user
		if ($user_ids === null)
		{
			$results = \Model_User::find_current();
			$results = $results->to_array();
		}
		else
		{
			if ( ! is_array($user_ids) || empty($user_ids)) return \RocketDuck\Msg::invalid_input();
			//user ids provided, get all of the users with the given ids
			$me = \Model_User::find_current_id();
			foreach ($user_ids as $id)
			{
				if (\RocketDuck\Util_Validator::is_pos_int($id))
				{
					$user = \Model_User::find($id);
					$user = $user->to_array();
					$user['isCurrentUser'] = ($id == $me);
					$results[] = $user;
				}
			}
		}
		return $results;
	}
	/**
	 * Updates the user's meta data
	 *
	 * @return int   User id
	 * @return bool  True if successful, otherwise returns an error
	 */
	static public function user_update_meta($new_meta)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		if ( ! is_array($new_meta)) return \RocketDuck\Msg::invalid_input('meta');
		if ( empty($new_meta)) return true;

		$user = \Model_User::find_current();
		foreach ($new_meta as $key => $val)
		{
			$user->profile_fields[$key] = $val;
		}
		return $user->save();
	}

	private static function _normalize_perms($perms_array)
	{
		// convert each permission object in the perms array to a integer indexed array of values
		foreach ($perms_array as &$perm_obj)
		{
			// convert perms to an array
			if ( ! is_array($perm_obj->perms)) $perm_obj->perms = (array) $perm_obj->perms;

			// convert the keys from string numeric keys to integers
			foreach ($perm_obj->perms as $key => $value)
			{
				if ( ! is_int($key))
				{
					// convert string numeric keys to number keys
					unset($perm_obj->perms[$key]);
					$perm_obj->perms[(integer) $key] = $value;
				}
			}
		}
		return $perms_array;
	}

	private static function _filter_increasing_perms($perms, $current_perms)
	{
		// I can only reduce my perms, filter out anything that increases or adds
		foreach ($perms->perms as $key => $value)
		{
			// remove any perm I didn't already have
			if ( ! array_key_exists($key, $current_perms))
			{
				unset($perms->perms[$key]);
				continue;
			}
			// make sure i'm not enabling anything i didn't already have
			if ($value != $current_perms[$key] && $value == Perm::ENABLE)
			{
				$perms->perms[$key] = $current_perms[$key];
			}
		}
		return $perms;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 * @param array   An array with user_id's and the perms to assign them
	 *				  Example:
	 *				  [0]
	 *             ['user_id'] => 5443
	 *             ['expiration'] => null                 // null expiration == no expiration //
	 *             ['perms'] => [ [0] => 1, [30] => 1]
	 *
	 * @review Needs code review
	 */
	static public function permissions_set($item_type, $item_id, $perms_array)
	{
		if (\Model_User::verify_session('basic_author') !== true) return \RocketDuck\Msg::no_login();
		if ( ! \RocketDuck\Util_Validator::is_valid_hash($item_id)) return \RocketDuck\Msg::invalid_input('Invalid item id: '.$item_id);
		if (empty($perms_array)) return \RocketDuck\Msg::invalid_input('empty user perms');

		$perms_array = static::_normalize_perms($perms_array);

		$cur_user_id = \Model_user::find_current_id();

		// full perms or is super user required
		$can_give_access = Perm_Manager::check_user_perm_to_object($cur_user_id, $item_id, $item_type, [Perm::FULL]) || \Model_User::verify_session('super_user');

		// filter out any permissions I can't do
		foreach ($perms_array as &$new_perms)
		{
			// i cant do anything
			if ( ! $can_give_access && $new_perms->user_id != $cur_user_id) return \RocketDuck\Msg::no_perm();

			$old_perms = Perm_Manager::get_user_object_perms($item_id, $item_type, $new_perms->user_id);
			$requested_perm_count = count($new_perms->perms);

			// I can only reduce my perms, filter out anything that increases or adds
			if ( ! $can_give_access && $new_perms->user_id == $cur_user_id)
			{
				$new_perms = static::_filter_increasing_perms($new_perms, $old_perms);
			}

			// Toss out an error if all the perms I asked for get filtered out
			if ($requested_perm_count > 0 && count($new_perms->perms) < 1 ) return \RocketDuck\Msg::no_perm();

			// Determine what type of notification to send
			// Search perms for enabled value and get key (new_perm)
			// array_search returns false if value was not found
			// need strict type checking because 0 == false
			$new_perm   = array_search(Perm::ENABLE, $new_perms->perms);
			$is_enabled = $new_perm !== false;
			$notification_mode = '';

			if ( ! $is_enabled)
			{
				$notification_mode = 'disabled';
			}
			else if ($old_perms != [$new_perm => Perm::ENABLE])
			{
				$notification_mode = 'changed';
			}

			\Model_Notification::send_item_notification($cur_user_id, $new_perms->user_id, $item_type, $item_id, $notification_mode, $new_perm);

			// set VIEW access for all of its assets
			if ($item_type === Perm::INSTANCE)
			{
				Perm_Manager::set_user_game_asset_perms($item_id, $new_perms->user_id, [Perm::VISIBLE => $is_enabled], $new_perms->expiration);
			}

			Perm_Manager::set_user_object_perms($item_id, $item_type, $new_perms->user_id, $new_perms->perms, $new_perms->expiration);
		}

		return true;
	}
	/**
	 * Returns all perms for an item
	 *
	 * @param int the number of the type of item (game, question, asset, etc)
	 * @param int the items id (for a game use the Game Instance ID, etc)
	 *
	 * @return array Contains an array with the uid and the permission number of that user.
	 *
	 * @notes getGameSharingStatus getPendingShares
	 */
	static public function permissions_get($item_type, $item_id)
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();
		return Perm_Manager::get_all_users_explicit_perms($item_id, $item_type);
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @notes getNotifications, getNumNotifications,
	 */
	static public function notifications_get()
	{
		if (\Model_User::verify_session() !== true) return \RocketDuck\Msg::no_login();

		$notifications = \Model_Notification::query()
			->where('to_id', \Model_User::find_current_id())
			->get();

		$return_array = [];

		foreach ($notifications as $notification)
		{
			$return_array[] = $notification->to_array();
		}

		//API conversion process requires an array, not JSON formatted data
		return $return_array;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static public function notification_delete($note_id)
	{
		if ( ! \Model_User::verify_session()) return \RocketDuck\Msg::no_login();

		$user = \Model_User::find_current();

		$note = \Model_Notification::query()
			->where('id', $note_id)
			->where('to_id', $user->id)
			->get();

		if ($note)
		{
			$note[$note_id]->delete();
			return true;
		}
		return false;
	}
	/**
	 * Returns all of the semesters from the semester table
	 *
	 */
	static public function semester_get()
	{
		return Semester::get_all();
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 */
	static private function _validate_play_id($play_id)
	{
	 	$play = new Session_Play();
		$user = \Model_User::find_current();
		$play->get_by_id($play_id);
		$inst_id = $play->inst_id;
		$instances = static::widget_instances_get([$inst_id], false);
		$inst = $instances[0];
		if ( ! count($instances)) throw new HttpNotFoundException;

		$can_play = Perm_Manager::can_play($user, $inst);

		if ($can_play)
	 	{
	 		if ($play->get_by_id($play_id))
	 		{
	 			if ($play->is_valid == 1)
	 			{
	 				$play->update_elapsed(); // update the elapsed time
	 				return $play;
	 			}
	 		}
	 	}
	 	else
	 	{
	 		// invalidate the play
	 		if ($play->get_by_id($play_id)) $play->invalidate();
	 	}
	 	return false;
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	static protected function _decrypt_logs($logs)
	{
		// NOTE: this will need to have a session to have the secret key
		$num_logs = count($logs);
		for ($i = 0; $i < $num_logs; $i++)
		{
			if ($logs[$i]['encrypted'])
			{
				$logs[$i] = \Event::trigger('Materia.decrypt', $logs[$i]['data'], 'object');
				$logs[$i] = (array)$logs[$i];
			}
		}
		return $logs;
	}
}
