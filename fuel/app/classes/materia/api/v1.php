<?php
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
Available Verbs:
- get   	(retrive a value)
- create	(create/save a new value)
- delete	(remove a value)
- edit  	(update a value)
- copy  	(duplicate a value)
- do    	(action when the above verbs dont fit)
- Other verbs can be used, but only when the above do not fit
*/

namespace Materia;
use \Materia\Msg;
use \Materia\Util_Validator;

class Api_V1
{
	/**
	 * Finds widgets that are specified in the database as spotlight widgets.
	 */
	static public function widgets_get($widgets = null)
	{
		return Widget_Manager::get_widgets($widgets);
	}

	/**
	 * Finds widgets based on a given preset criteria ("all", etc)
	 */
	static public function widgets_get_by_type($type)
	{
		return Widget_Manager::get_widgets([], $type);
	}

	static public function widget_instances_get($inst_ids = null, bool $deleted = false)
	{
		// get all my instances - must be logged in
		if (empty($inst_ids))
		{
			if (\Service_User::verify_session() !== true) return Msg::no_login(); // shortcut to returning noting
			return Widget_Instance_Manager::get_all_for_user(\Model_User::find_current_id());
		}

		// get specific instances - no log in required
		if ( ! is_array($inst_ids)) $inst_ids = [$inst_ids]; // convert string into array of items
		return Widget_Instance_Manager::get_all($inst_ids, false, false, $deleted);
	}

/**
 * Takes a page number, and returns objects containing the total_num_pages and
 * widget instances that are visible to the user.
 *
 * @param page_number The page to be requested. By default it is set to 1.
 *
 * @return array of objects containing total_num_pages and widget instances that are visible to the user.
 */
	static public function widget_paginate_user_instances_get($page_number = 0)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		$data = Widget_Instance_Manager::get_paginated_instances_for_user(\Model_User::find_current_id(), $page_number);
		return $data;
	}

	/**
	 * @return bool, true if successfully deleted widget instance, false otherwise.
	 */
	static public function widget_instance_delete($inst_id)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL]) && ! Perm_Manager::is_support_user()) return Msg::no_perm();
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;

		$result = $inst->db_remove();
		if ($result)
		{
			return $inst_id;
		}
		else
		{
			return Msg::failure('Failed to remove widget instance from database');
		}
	}

	static public function widget_instance_access_perms_verify($inst_id)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);

		if ( ! static::has_perms_to_inst($inst_id, [Perm::VISIBLE, Perm::FULL]))
		{
			return Msg::no_perm();
		}
		return true;
	}

	/**
	 * @return object, contains properties indicating whether the current
	 * user can edit the widget and a message object describing why, if not
	 */

	 // !! this endpoint should be significantly refactored or removed in the future API overhaul !!
	static public function widget_instance_edit_perms_verify(string $inst_id)
	{
		$response = new \stdClass();

		$response->is_locked = false;
		$response->can_publish = false;
		$response->can_edit = false;

		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		else if (\Service_User::verify_session() !== true) return Msg::no_login();
		else if ( ! ($inst = Widget_Instance_Manager::get($inst_id)))  throw new \HttpNotFoundException;

		$response->is_locked = ! Widget_Instance_Manager::locked_by_current_user($inst_id);
		$response->can_publish = $inst->widget->publishable_by(\Model_User::find_current_id());
		$response->can_edit = static::has_perms_to_inst($inst_id, [Perm::FULL]);

		return $response;
	}

	/**
	 * @return bool, true if the current user can publish the given widget instance, false otherwise.
	 */
	static public function widget_publish_perms_verify(int $widget_id)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! Util_Validator::is_pos_int($widget_id)) return Msg::invalid_input($widget_id);

		$widget = new Widget();
		if ( $widget->get($widget_id) == false) return Msg::invalid_input('Invalid widget type');

		return $widget->publishable_by(\Model_User::find_current_id());
	}

	static private function has_perms_to_inst($inst_id, $perms)
	{
		return Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, Perm::INSTANCE, $perms);
	}

	// copies a widget instance
	static public function widget_instance_copy(string $inst_id, string $new_name, bool $copy_existing_perms = false)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL]) && ! Perm_Manager::is_support_user()) return Msg::no_perm();
		$inst = Widget_Instance_Manager::get($inst_id, true);
		if ( ! $inst) return Msg::failure('Widget instance could not be found.');

		try
		{
			// retain access - if true, grant access to the copy to all original owners
			$current_user_id = \Model_User::find_current_id();
			if ( ! $current_user_id) return Msg::failure('Could not find current user.');
			$duplicate = $inst->duplicate($current_user_id, $new_name, $copy_existing_perms);
			return $duplicate;
		}
		catch (\Exception $e)
		{
			return Msg::failure('Widget instance could not be copied.');
		}
	}

	/**
	 * @param int     $widget_id The Game resource ID
	 * @param object  $qset
	 * @param bool    $is_draft Whether the widget is being saved as a draft
	 * @param int     $inst_id (optional) The id of the game (widget) we're saving
	 *
	 * @return array An associative array with details about the save
	 */

	static public function widget_instance_save($widget_id=null, $name=null, $qset=null, $is_draft=null)
	{
		return static::widget_instance_new($widget_id, $name, $qset, $is_draft);
	}

	static public function widget_instance_new($widget_id=null, $name=null, $qset=null, $is_draft=null)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');
		if ( ! Util_Validator::is_pos_int($widget_id)) return Msg::invalid_input($widget_id);
		if ( ! is_bool($is_draft)) $is_draft = true;

		$widget = new Widget();
		if ( $widget->get($widget_id) == false) return Msg::invalid_input('Invalid widget type');
		if ( ! $is_draft && ! $widget->publishable_by(\Model_User::find_current_id()) ) return Msg::no_perm('Widget type can not be published by students.');
		if ( $is_draft && ! $widget->is_editable) return Msg::failure('Non-editable widgets can not be saved as drafts!');

		$is_student = ! \Service_User::verify_session(['basic_author', 'super_user']);
		$inst = new Widget_Instance([
			'user_id'         => \Model_User::find_current_id(),
			'name'            => $name,
			'is_draft'        => $is_draft,
			'created_at'      => time(),
			'widget'          => $widget,
			'is_student_made' => $is_student,
			'guest_access'    => $is_student,
			'attempts'        => -1
		]);

		if ( ! empty($qset->data)) $inst->qset->data = $qset->data;
		if ( ! empty($qset->version)) $inst->qset->version = $qset->version;

		try
		{
			$inst->db_store();
			return $inst;
		}
		catch (\Exception $e)
		{
			trace($e);
			return Msg::failure('Widget instance could not be saved.');
		}
	}

	/**
	 * Save and existing instance
	 *
	 * @param int     $inst_id
	 * @param string  $name
	 * @param object  $qset
	 * @param bool    $is_draft Whether the widget is being saved as a draft
	 * @param int     $open_at
	 * @param int     $close_at
	 * @param int     $attempts
	 * @param bool    $guest_access
	 * @param bool 	  $is_student_made // NOT USED
	 *
	 * @return array An associative array with details about the save
	 */
	static public function widget_instance_update($inst_id=null, $name=null, $qset=null, $is_draft=null, $open_at=null, $close_at=null, $attempts=null, $guest_access=null, $embedded_only=null, $is_student_made=null)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if (\Service_User::verify_session('no_author')) return Msg::invalid_input('You are not able to create or edit widgets.');
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input('Instance id is invalid');
		if ( ! static::has_perms_to_inst($inst_id, [Perm::FULL])) return Msg::no_perm();

		$inst = Widget_Instance_Manager::get($inst_id, true);
		if ( ! $inst) return Msg::failure('Widget instance could not be found.');
		if ( $is_draft && ! $inst->widget->is_editable) return Msg::failure('Non-editable widgets can not be saved as drafts!');
		if ( ! $is_draft && ! $inst->widget->publishable_by(\Model_User::find_current_id())) return Msg::no_perm('Widget type can not be published by students.');

		// student made widgets are locked forever
		if ($inst->is_student_made)
		{
			if ($guest_access === false)
			{
				return new Msg('Student-made widgets must stay in guest access mode.', 'Student Made', 'error', false);
			}
			$attempts = -1;
			$guest_access = true;
		}

		if ( ! empty($qset->data) && ! empty($qset->version))
		{
			$inst->qset = $qset;
		}
		else
		{
			// if the qset is not explicitly provided, assume it is not being updated
			// if $inst->qset is populated it will be saved to the db as a new qset version - which isn't necessary
			$inst->qset = (object) ['version' => null, 'data' => null];
		}
		if ( ! empty($name))
		{
			if ($inst->name != $name)
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Name',
					'value_2' => $name
				]);
				$activity->db_store();
			}
			$inst->name = $name;
		}
		if ($is_draft !== null)
		{
			if ($inst->is_draft != $is_draft)
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Is Draft',
					'value_2' => $is_draft
				]);
				$activity->db_store();
			}
			$inst->is_draft = $is_draft;
		}
		if ($open_at !== null)
		{
			if ($inst->open_at != $open_at)
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Open At',
					'value_2' => $open_at
				]);
				$activity->db_store();
			}
			$inst->open_at = $open_at;
		}
		if ($close_at !== null)
		{
			if ($inst->close_at != $close_at)
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Close At',
					'value_2' => $close_at
				]);
				$activity->db_store();
			}
			$inst->close_at = $close_at;
		}
		if ($attempts !== null)
		{
			if ($inst->attempts != $attempts)
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Attempts',
					'value_2' => $attempts
				]);
				$activity->db_store();
			}
			$inst->attempts = $attempts;
		}
		if ($guest_access !== null)
		{
			// if the user is a student and they're not the owner, they can't do anything
			// if the user is a student and they're the owner, they're allowed to set it to guest access
			if (($inst->user_id == \Model_User::find_current_id() && $guest_access) || ! Perm_Manager::is_student(\Model_User::find_current_id()))
			{
				if ($inst->guest_access != $guest_access)
				{
					$activity = new Session_Activity([
						'user_id' => \Model_User::find_current_id(),
						'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
						'item_id' => $inst_id,
						'value_1' => 'Guest Access',
						'value_2' => $guest_access
					]);
					$activity->db_store();
				}
				$inst->guest_access = $guest_access;
				// when disabling guest mode on a widget, make sure no students have access to that widget
				if ( ! $guest_access)
				{
					$access = Perm_Manager::get_all_users_explicit_perms($inst_id, Perm::INSTANCE)['widget_user_perms'];
					foreach ($access as $user_id => $user_perms)
					{
						if (Perm_Manager::is_student($user_id) && $user_id != $inst->user_id)
						{
							\Model_Notification::send_item_notification(\Model_user::find_current_id(), $user_id, Perm::INSTANCE, $inst_id, 'disabled', null);
							Perm_Manager::clear_user_object_perms($inst_id, Perm::INSTANCE, $user_id);
						}
					}
				}
			}
		}

		if ($embedded_only !== null)
		{
			// if current user is student, they cannot change embedded_only
			if ($inst->embedded_only != $embedded_only && ! Perm_Manager::is_student(\Model_User::find_current_id()))
			{
				$activity = new Session_Activity([
					'user_id' => \Model_User::find_current_id(),
					'type'    => Session_Activity::TYPE_EDIT_WIDGET_SETTINGS,
					'item_id' => $inst_id,
					'value_1' => 'Embedded Only',
					'value_2' => $embedded_only
				]);
				$activity->db_store();

				$inst->embedded_only = $embedded_only;
			}
		}

		try
		{
			$inst->db_store();
			return $inst;
		}
		catch (\Exception $e)
		{
			return Msg::failure('Widget could not be created.');
		}
	}

	/**
	 * Lock a widget to prevent others from editing it
	 * @return true if we have or are able to get a lock on this game
	 */
	static public function widget_instance_lock($inst_id)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! static::has_perms_to_inst($inst_id, [Perm::VISIBLE, Perm::FULL])) return Msg::no_perm();
		return Widget_Instance_Manager::lock($inst_id);
	}

	static public function session_play_create($inst_id, $context_id=false)
	{
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();
		if ( $inst->is_draft == true) return Msg::failure('Drafts Not Playable', 'Must use Preview to play a draft.');

		$play = new Session_Play();
		$play_id = $play->start(\Model_User::find_current_id(), $inst_id, $context_id);
		return $play_id;
	}

	static public function session_logout()
	{
		$activity = new Session_Activity([
			'user_id' => \Model_User::find_current_id(),
			'type'    => Session_Activity::TYPE_LOGGED_OUT
		]);
		$activity->db_store();
		return \Auth::logout();
	}

	static public function session_login($user, $pass)
	{
		return \Service_User::login($user, $pass);
	}

	/**
	 * Dedicated session validation call for the creator. Because a play isn't created, no need to verify session user w/ model user.
	  */
	static public function session_author_verify($role_name = null)
	{
		return \Service_User::verify_session($role_name);
	}

	/**
	 * Session validation call for the player. Performs the standard session verification and additionally verifies that the user currently authenticated matches the user stored in play data.
	 */
	static public function session_play_verify($play_id)
	{
		// Standard session validation first
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		// if $play_id is null, assume it's a preview, no need for user check
		if ( ! $play_id) return true;

		// Grab user id from play data
		$play_data = new Session_Play();
		$play_data->get_by_id($play_id);

		// Grab id of currently authenticated user
		$current_user_id = \Model_User::find_current_id();

		// Compare and return boolean
		return $play_data->user_id == $current_user_id;
	}

	/**
	 * Get play activity history based on user's user_id
	 */
	static public function play_activity_get($start = 0, $range = 6)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
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
		if ( ! $preview_inst_id)
		{
			$inst = self::_get_instance_for_play_id($play_id);
			if ( ! $inst->playable_by_current_user()) return Msg::no_login();

			// Ensure user comparison between session & model checks out
			if ( ! $inst->guest_access && self::session_play_verify($play_id) !== true) return Msg::no_login();
		}
		else
		{
			// No user in session, just perform auth check
			if (\Service_User::verify_session() !== true) return Msg::no_login();
		}

		if ( $preview_inst_id === null && ! Util_Validator::is_valid_long_hash($play_id)) return Msg::invalid_input($play_id);
		if ( ! is_array($logs) || count($logs) < 1 ) return Msg::invalid_input('missing log array');

		// ============ PREVIEW MODE =============
		if (Util_Validator::is_valid_hash($preview_inst_id))
		{
			Score_Manager::save_preview_logs($preview_inst_id, $logs);
			return true;
		}
		// ============ PLAY FOR KEEPS ===========
		else
		{
			$play = self::_validate_play_id($play_id);
			if ( ! ($play instanceof Session_Play)) return Msg::invalid_input('Invalid play session');
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

			// we may not have loaded the widget yet
			if ( ! isset($inst->widget))
			{
				$inst = Widget_Instance_Manager::get($play->$inst_id);
			}

			$class = $inst->widget->get_score_module_class();
			$score_mod = new $class($play->id, $inst, $play);
			$score_mod->log_problems = true;

			// make sure that the logs arent timestamped wrong or recieved incorrectly
			if ($score_mod->validate_times() == false)
			{
				$play->invalidate();
				return Msg::failure('Timing validation error.');
			}

			// if widget is not scorable, check for a participation score log
			// if one is found, use it as a "score" event for LTI passback
			if ( ! $inst->widget->is_scorable)
			{
				foreach ($logs as $log)
				{
					if (Session_Logger::get_type($log['type']) == Session_Log::TYPE_SCORE_PARTICIPATION)
					{
						\Event::trigger('score_updated', [$play->id, $play->inst_id, $play->user_id, $log['value'], 100], 'string');
					}
				}
			}

			// validate the scores the game generated on the server
			try
			{
				$score_mod->validate_scores();
			}
			catch (Score_Exception $e)
			{
				$play->invalidate();
				return Msg::failure($e->message, $e->title);
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
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		return Widget_Asset_Manager::get_assets_by_user(\Model_User::find_current_id(), Perm::FULL);
	}

	/**
	 * Returns all scores for the given widget instance recorded by the current user, and attmepts remaining in the current context.
	 * If no launch token is supplied, the current semester will be used as the current context.
	 *
	 * @param string $inst_id The widget instance ID
	 * @param string $token The launch token corresponding to the first play in a series of replays, if it exists
	 *
	 * @return array An array containing a list of scores as an array and the number of attempts left in the current context, if applicable
	 */
	static public function widget_instance_scores_get($inst_id, $token=false)
	{
		$result = $token ? \Event::trigger('before_score_display', $token) : null;
		$context_id = empty($result) ? null : $result;
		if ( ! $token && \Session::get('context_id', false)) $context_id = \Session::get('context_id');

		$semester = Semester::get_current_semester();

		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		$scores = Score_Manager::get_instance_score_history($inst_id, $context_id);
		$attempts_used = count(Score_Manager::get_instance_score_history($inst_id, $context_id, $semester));
		$extra = Score_Manager::get_instance_extra_attempts($inst_id, \Model_User::find_current_id(), $context_id, $semester);

		$attempts_left = $inst->attempts - $attempts_used + $extra;

		return [
			'scores' => $scores,
			'attempts_left' => $attempts_left
		];
	}

	static public function widget_instance_play_scores_get($play_id, $preview_mode_inst_id = null)
	{
		// if not preview, see if current user can play widget
		if ( ! $preview_mode_inst_id)
		{
			$inst = self::_get_instance_for_play_id($play_id);
			if ( ! $inst->playable_by_current_user()) return Msg::no_login();
		}
		// otherwise see if user has valid session
		else
		{
			if (\Service_User::verify_session() !== true) return Msg::no_login();
		}

		if (Util_Validator::is_valid_hash($preview_mode_inst_id))
		{
			$inst = Widget_Instance_Manager::get($preview_mode_inst_id);
			$preview_logs = Score_Manager::get_preview_logs($inst);
			if ( ! is_array($preview_logs)) return Msg::expired();
			else return $preview_logs;
		}
		else
		{
			if (Util_Validator::is_valid_long_hash($play_id) != true) return Msg::invalid_input($play_id);
			return Score_Manager::get_play_details([$play_id]);
		}
	}

	/**
	 * Gets a single score corresponding to a play_id for guest widgets.
	 *
	 * @param int $inst_id The widget instance ID
	 * @param int $play_id The play ID
	 *
	 * @return array Single item array which holds the score or is empty
	 */
	static public function guest_widget_instance_scores_get($inst_id, $play_id)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();
		return Score_Manager::get_guest_instance_score_history($inst_id, $play_id);
	}

	/**
	 *	Gets scores/players for a particular game
	 *	Returns an array with the following:
	 *
	 *	@return array [players]     a list of players that played this game <br />
	 *				  [quickStats]	contains attempts, scores, currentPlayers, avScore, replays <br />
	 *				  [playLogs]    a log of all scores recoreded
	 */
	static public function play_logs_get($inst_id, $semester = 'all', $year = 'all', $page_number=1)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! static::has_perms_to_inst($inst_id, [Perm::VISIBLE, Perm::FULL])) return Msg::no_perm();
		$is_student = ! \Service_User::verify_session(['basic_author', 'super_user']);

		$data = Session_Play::get_by_inst_id_paginated($inst_id, $semester, $year, $page_number, $is_student);
		return $data;
	}

	/**
	 * Gets score distributions (total and by semester) for a widget instance.
	 * See documentation in Score_Manager for more information.
	 */
	static public function score_summary_get($inst_id, $include_storage_data = false)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

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
			return($b['id'] - $a['id']);
		});
		return $summary;
	}

	/**
	 * Gets an unsorted array containing all completed scores for a widget for the current semester, unless requested otherwise
	 *
	 * @param int $inst_id The widget instance ID
	 * @param bool $get_all Flag to request all scores for a widget, not just those of the current semester
	 *
	 * @return array Flat array that holds numerical scores for the widget for the requested time frame
	 */
	static public function score_raw_distribution_get($inst_id, $get_all = false)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		// ask the score module if it allows score_distribution
		try{
			$class = $inst->widget->get_score_module_class();
			$score_mod = new $class(-1, $inst);
			if ( ! $score_mod || empty($score_mod->allow_distribution) ) return false;
		}
		catch (\Exception $e) {
			trace("Error loading score module for {$inst_id}");
			return Msg::failure("Error loading score module for {$inst_id}");
		}

		$result = null;

		if ($get_all == true)
		{
			$result = Score_Manager::get_all_widget_scores($inst_id);
		}
		else
		{
			$semester = Semester::get_current_semester();
			$result = Score_Manager::get_widget_scores_for_semester($inst_id, $semester);
		}

		$scores = [];
		foreach ($result as $score)
		{
			$scores[] = (int) $score['score'];
		}
		return $scores;
	}

	/**
	 * Gets Storage Data (if any) for the widget with the given instance ID.
	 * Current user must have access permission to the widget.
	 * @param int $inst_id the The id of the widget instance to request
	 * @return array Array containing storage data for this widget instance
	 */
	static public function play_storage_get($inst_id)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		return Storage_Manager::get_storage_data($inst_id);
	}
	/**
	 * Gets the Question Set for the widget with the given instance ID.
	 * Current user must have author/collab access to the widget or
	 * a valid play ID for this to work.
	 * @notes users that are logged in and already have a valid play ID have already passed access test, so no need to try again
	 * @param int $inst_id The id of the widget instance to get the qset for (formerly inst_id)
	 * @param int $play_id The play id associated with a play session
	 * @param int $timestamp The timestamp after which no qsets should be returned
	 * @return object QSET
	 */
	static public function question_set_get($inst_id, $play_id = null, $timestamp = false)
	{
		if ( ! Util_Validator::is_valid_hash($inst_id) ) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		// valid play id sent?
		if ( ! empty($play_id) && ! $timestamp && ! static::_validate_play_id($play_id))
		{
			return Msg::no_login();
		}

		// if preview mode, can I preview?
		if (empty($play_id) && ! $inst->viewable_by(\Model_User::find_current_id())) return Msg::no_perm();

		$inst->get_qset($inst_id, $timestamp);

		return $inst->qset;
	}


	/**
	 * Determines whether a question set can generated for a given widget using OpenAI.
	 * @param string $inst_id The instance ID of the widget
	 * @return bool Whether a question set can be generated
	 */
	static public function question_set_is_generable($inst_id)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		// check if the widget supports generation
		if ( ! $inst->widget->is_generable)
		{
			return [
				'msg' => 'Widget does not support generation',
				'generable' => false
			];
		}

		// check if API key is even valid, or exists
		$api_key = \Config::get('materia.open_ai.api_key');
		if (empty($api_key))
		{
			return [
				'msg' => 'API key not set',
				'generable' => false
			];
		}

		try {
			$client = \OpenAI::client($api_key);
		} catch (\Exception $e) {
			// return an error for more descriptive handling on the front-end
			return [
				'msg' => $e->getMessage(),
				'generable' => false
			];
		}

		return [
			'msg' => 'Widget is generable',
			'generable' => true
		];
	}

	/**
	 * Generates a question set based on a given instance ID, topic, and whether to include images.
	 * @param object $input The input object containing the instance ID, topic, and whether to include images
	 * @return object The generated question set
	 */
	static public function question_set_generate($input)
	{
		$inst_id = $input->inst_id;
		$topic = $input->topic;
		$include_images = $input->include_images;
		$num_questions = $input->num_questions;
		$build_off_existing = $input->build_off_existing;

		// validate instance
		if ( ! Util_Validator::is_valid_hash($inst_id) ) return Msg::invalid_input($inst_id);
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();
		if ( ! static::question_set_is_generable($inst_id)['generable']) return Msg::failure('Unable to generate question set for this widget.');

		// clean topic of any special characters
		$topic = preg_replace('/[^a-zA-Z0-9\s]/', '', $topic);
		// count words in topic
		$topic_words = explode(' ', $topic);
		if (count($topic_words) < 3) return new Msg(Msg::ERROR, 'Topic must be at least 3 words long');

		// validate number of questions
		if ($num_questions < 1) $num_questions = 8;

		\Log::info('num_questions: '.$num_questions);
		\Log::info('num_questions to string: '.strval($num_questions));
		\Log::info('Generating question set for instance '.$inst_id.' on topic '.$topic);

		// get the widget and demo instance
		$widget = $inst->widget;
		$demo = Widget_Instance_Manager::get($widget->meta_data['demo']);
		if ( ! $demo) throw new \HttpNotFoundException;
		$instance_name = $inst->name;
		$widget_name = $widget->name;
		$about = $widget->meta_data['about'];
		$qset_version = 1;
		$custom_prompt = isset($widget->meta_data['generation_prompt']) ? $widget->meta_data['generation_prompt'][0] : null;
		\Log::info('Custom prompt: '.print_r($custom_prompt, true));

		// time for logging
		$start_time = microtime(true);
		$time_elapsed_secs = 0;

		if ($build_off_existing)
		{
			$qset = static::question_set_get($inst_id);
			if ( ! $qset) return new Msg(Msg::ERROR, 'No existing question set found');
			$qset_version = $qset->version;

			$qset_text = json_encode($qset->data);

			// non-demo non-image prompt
			$text = "Using the exact same format of the following question set without changing any field keys or data types and without changing any of the existing questions, generate {$num_questions} more questions and add them to the existing qset. The new questions must be based on this topic: '{$topic}'. Return only the JSON for the resulting question set.";

			if ($include_images)
			{
				$text = $text."Do not use real names. In every asset or assets field in new questions, add a field to each asset object titled 'description' that best describes the image within the answer or question's context. Do not generate descriptions that would violate OpenAI's image generation safety system. ID's must be NULL.";
			}
			else
			{
				$text = $text."Leave the asset fields empty. ID's must be NULL.";
			}

			if ($custom_prompt && ! empty($custom_prompt))
			{
				$text = $text."Lastly, the following instructions apply to the {$widget->name} widget specifically: {$custom_prompt}";
			}

			$text = $text."\n{$qset_text}";
		}
		else
		{
			// get the demo.json from the demo instance
			$demo_qset = static::question_set_get($widget->meta_data['demo']);
			$qset_version = $demo_qset->version;
			if ( ! $demo_qset) throw new \HttpNotFoundException;
			$qset_text = json_encode($demo_qset->data);

			// non-image prompt
			$text = "{$instance_name} is a {$widget->name} widget, described as: '{$about}'. The following is a question set storing an example instance called {$demo->name}. Using the exact same format without changing any field keys or data types, return only the JSON for a question set based on this topic: '{$topic}'. Ignore the demo instance topic entirely. Replace the field values with generated values. Generate a total {$num_questions} of questions. IDs must be NULL.";

			// image prompt
			if ($include_images)
			{
				$text = $text."Do not use real names. Find the field storing image assets. This could be labeled as an asset, assets, image field or similar. Add a field to each asset titled 'description' that best describes the image within the answer or question's context. Do not generate descriptions that would violate OpenAI's image generation safety system.";
			}
			else
			{
				// $text = $text."Do not generate image-type questions/answers, only text-type questions/answers. Therefore, leave the asset fields empty for image, video, or audio questions/answers, but NOT text-type. If the 'materiaType' of an asset is 'text', create a field titled 'value' with the question/answer text insidet the asset object.\n{$qset_text}";
				$text = $text."Leave asset fields empty for any type of media (image, video, or audio). If the 'materiaType' of an asset is 'text', create a field titled 'value' with the text inside the asset object.";
			}

			if ($custom_prompt && ! empty($custom_prompt))
			{
				$text = $text."Lastly, the following instructions apply to the {$widget->name} widget specifically: {$custom_prompt}";
			}

			$text = $text."\n{$qset_text}";
		}

		\Log::info('Prompt text: '.$text);

		try {
			// to access openai, define the openai key in the environment (.env file)
			$my_api_key = \Config::get('materia.open_ai.api_key');
			$client = \OpenAI::client($my_api_key);
			$result = $client->chat()->create([
				'model' => 'gpt-3.5-turbo',
				'response_format' => (object) ['type' => 'json_object'],
				'messages' => [
					['role' => 'user', 'content' => $text]
				],
				'max_tokens' => 4096,
				'frequency_penalty' => 0, // 0 to 1
				'presence_penalty' => 0, // 0 to 1
				'temperature' => 1, // 0 to 1
				'top_p' => 1, // 0 to 1

			]);

			$question_set = json_decode($result->choices[0]->message->content);
			\Log::info('Generated question set: '.print_r(json_encode($question_set), true));

			$time_elapsed_secs = microtime(true) - $start_time;
			$cost_input_tokens = 0.50 / 1000000; // $0.50 per 1 million tokens
			$cost_output_tokens = 1.50 / 1000000; // $1.50 per 1 million tokens

			$file = fopen('openai_usage.txt', 'a');
			fwrite($file, PHP_EOL);
			fwrite($file, 'Widget: '.$widget_name.PHP_EOL);
			fwrite($file, 'Date: '.date('Y-m-d H:i:s').PHP_EOL);
			fwrite($file, 'Time to complete (in seconds): '.$time_elapsed_secs.PHP_EOL);
			fwrite($file, 'Number of questions asked to generate: '.$num_questions.PHP_EOL);
			fwrite($file, 'Included images: '.$include_images.PHP_EOL);
			fwrite($file, 'Prompt tokens: '.$result->usage->promptTokens.PHP_EOL);
			fwrite($file, 'Completion tokens: '.$result->usage->completionTokens.PHP_EOL);
			fwrite($file, 'Total tokens: '.$result->usage->totalTokens.PHP_EOL);
			fwrite($file, 'Total cost (in dollars): '.$result->usage->promptTokens * $cost_input_tokens + $result->usage->completionTokens * $cost_output_tokens.PHP_EOL);
			fclose($file);

		} catch (\Exception $e) {
			\Log::error('Error generating question set: '.$e->getMessage());

			$file = fopen('openai_usage.txt', 'a');
			fwrite($file, PHP_EOL);
			fwrite($file, 'Widget: '.$widget_name.PHP_EOL);
			fwrite($file, 'Date: '.date('Y-m-d H:i:s').PHP_EOL);
			fwrite($file, 'Time to complete (in seconds): '.$time_elapsed_secs.PHP_EOL);
			fwrite($file, 'Number of questions asked to generate: '.$num_questions.PHP_EOL);
			fwrite($file, 'Error: '.$e->getMessage().PHP_EOL);

			fclose($file);

			return new Msg(Msg::ERROR, 'Error generating question set');
		}

		if ($include_images)
		{
			$image_rate_cap = 5; // any higher and the API will return an error
			$assets = static::comb_assets($question_set); // get a list of all the asset descriptions

			// make sure we don't exceed the rate cap
			$num_assets = count($assets);
			$start_offset = 0;
			\Log::info('Number of assets: '.$num_assets);
			if ($num_assets > $image_rate_cap)
			{
				if ($build_off_existing)
				{
					$start_offset = $num_assets - $image_rate_cap;
				}
				$assets = array_slice($assets, $start_offset, $image_rate_cap);
			}
			if ($num_assets < 1)
			{
				return $question_set;
			}
			// join assets into string
			$assets_text = implode(', ', $assets);
			// generate images
			try {
				$my_api_key = \Config::get('materia.open_ai.api_key');
				$client = \OpenAI::client($my_api_key);
				$dalle_result = $client->images()->create([
					'model' => 'dall-e-2',
					'prompt' => $assets_text,
					'n' => count($assets),
					'response_format' => 'url', // urls available for only 60 minutes after
					'size' => '256x256' // 256x256, 512x512, 1024x1024
				]);

			} catch (\Exception $e) {
				\Log::error('Error generating images: '.$e->getMessage());
				\Log::error('Trace: '.$e->getTraceAsString());

				$file = fopen('openai_usage.txt', 'a');
				fwrite($file, 'Error generating images: '.$e->getMessage().PHP_EOL);
				fwrite($file, PHP_EOL);
				fclose($file);

				return $question_set;
			}

			$file = fopen('openai_usage.txt', 'a');
			fwrite($file, 'Generated images.');
			fwrite($file, PHP_EOL);
			fclose($file);

			\Log::info('Generated images: '.print_r($dalle_result, true));

			// Store assets in the database (permanent storage, not just URLs)
			// for ($i = 0; $i < count($dalle_result->data); $i++) {
			// 	$file_data = base64_decode($dalle_result->data[$i]->b64_json);

			// 	$src_area = \File::forge(['basedir' => sys_get_temp_dir()]); // restrict copying from system tmp dir
			// 	$mock_upload_file_path = \Config::get('file.dirs.media_uploads').uniqid('sideload_') . '.png';
			// 	\File::copy($file_data, $mock_upload_file_path, $src_area, 'media');

			// 	// process the upload
			// 	$upload_info = \File::file_info($mock_upload_file_path, 'media');
			// 	$asset = \Materia\Widget_Asset_Manager::new_asset_from_file('Dalle asset', $upload_info);

			// 	if ( ! isset($asset->id)) {
			// 		\Log::error('Unable to create asset');
			// 	} else {
			// 		$asset->db_store();
			// 		$dalle_result->data[$i]->url = $asset->id;
			// 	}
			// }

			// assign generated images to assets in qset
			static::assign_assets($question_set, $dalle_result->data, $start_offset, 0);
		}

		\Log::info('Generated question set with assets: '.print_r(json_encode($question_set), true));

		return [
			'qset' => $question_set,
			'version' => $qset_version
		];
	}

	/**
	 * Combines all asset descriptions in a question set into a single array
	 * @param array $qset The question set array
	 * @return array The array of asset descriptions
	 */
	static public function comb_assets($qset)
	{
		$assets = [];
		foreach ($qset as $key => $value)
		{
			if (is_object($value) || is_array($value))
			{
				$value = (array) $value;
				if ($key == 'asset' || $key == 'image' || $key == 'audio' || $key == 'video' || $key == 'options')
				{
					if (key_exists('description', $value) && ! empty($value['description']))
					{
						$assets[] = $value['description'];
					}
				}
				if ($key == 'assets')
				{
					$value = (array) $value;
					foreach ($value as $asset)
					{
						$asset = (array) $asset;
						if (key_exists('description', $asset) && ! empty($asset['description']))
						{
							$assets[] = $asset['description'];
						}
					}
				}
				$assets = array_merge($assets, static::comb_assets($value));
			}
		}
		return $assets;
	}

	/**
	 * Assigns generated images to assets in a question set
	 * @param array $array The question set array
	 * @param array $image_urls The array of image URLs
	 * @param int $image_index The index of the current image URL
	 * @return int The updated image index
	 */
	static public function assign_assets(&$array, $image_urls, $start_offset, $image_index)
	{
		if ( is_object($array) && isset($array->items)) $image_index = static::assign_assets($array->items, $image_urls, $start_offset, $image_index);
		else if ( ! $array || ! is_array($array)) return $image_index;

		foreach ($array as $key => $value)
		{
			if ($image_index >= count($image_urls))
			{
				return $image_index;
			}
			if (is_object($value) || is_array($value))
			{
				$value = (array) $value;
				if ($key == 'asset' || $key == 'image' || $key == 'audio' || $key == 'video' || $key == 'options')
				{
					if ( ! empty($value['description']))
					{
						if ($image_index >= $start_offset)
						{
							// b64
							// $base64 = $image_urls[$image_index]->b64_json;
							// $array[$key]->id = 'data:image/png;base64,'.$base64;
							// $array[$key]->url = $image_urls[$image_index]->b64_json;
							// $array[$key]->image = $image_urls[$image_index]->b64_json;

							// url
							$array[$key]->url = $image_urls[$image_index]->url;
							$array[$key]->id = $image_urls[$image_index]->url;
							$array[$key]->image = $image_urls[$image_index]->url;
						}
						$image_index += 1;
					}
				}
				if ($key == 'assets')
				{
					// iterate over assets array without converting to array
					// to avoid losing object properties
					foreach ($value as $asset)
					{
						\Log::info('asset: '.print_r($asset, true));
						if ( ! empty($asset->description))
						{
							if ($image_index >= $start_offset)
							{
								// b64
								// $base64 = $image_urls[$image_index]->b64_json;
								// $asset->id = 'data:image/png;base64,'.$base64;
								// $asset->url = $image_urls[$image_index]->b64_json;

								// url
								$asset->url = $image_urls[$image_index]->url;
								$asset->id = $image_urls[$image_index]->url;
							}
							$image_index += 1;
						}
					}
				}
				$image_index = static::assign_assets($value, $image_urls, $start_offset, $image_index);
			}
		}
		return $image_index;
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
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		// get specific questions
		if ($ids)
		{
			if ( ! is_array($ids)) return Msg::invalid_input($ids);
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

	static public function play_storage_data_save($play_id, $data)
	{
		$inst = self::_get_instance_for_play_id($play_id);
		if ( ! $inst->playable_by_current_user()) return Msg::no_login();

		// Make sure widget is being played by the correct user (when guest access not enabled)
		if ( ! $inst->guest_access && self::session_play_verify($play_id) !== true) return Msg::no_login();

		if ($play = Api_V1::_validate_play_id($play_id)) //valid play id or logged in
		{
			$user_id = $inst->guest_access ? 0 : $play->user_id; // store as guest or user?
			Storage_Manager::parse_and_store_storage_array($play->inst_id, $play_id, $user_id, $data);
			return true;
		}
		else
		{
			return Msg::no_login();
		}
	}

	static public function play_storage_data_get($inst_id, $format=null) // formerly $inst_id
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! Util_Validator::is_valid_hash($inst_id)) return Msg::invalid_input($inst_id);
		switch ($format)
		{
			case 'csv':
				return Storage_Manager::get_csv_logs_by_inst_id($inst_id);

			default:
				return Storage_Manager::get_storage_data($inst_id);
		}
	}

	static public function semester_date_ranges_get()
	{
		return Utils::get_date_ranges();
	}

	/**
	 * Paginated search for users that match input
	 *
	 * @param string Search query
	 * @param string Page number
	 * @return array List of users
	 */
	static public function users_search($input, $page_number = 0)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		$items_per_page = 50;
		$offset = $items_per_page * $page_number;

		// query DB for only a single page + 1 item
		$displayable_items = \Model_User::find_by_name_search($input, $offset, $items_per_page + 1);

		$has_next_page = sizeof($displayable_items) > $items_per_page ? true : false;

		if ($has_next_page) array_pop($displayable_items);

		foreach ($displayable_items as $key => $person)
		{
			$displayable_items[$key] = $person->to_array();
		}

		$data = [
			'pagination' => $displayable_items,
		];

		if ($has_next_page) $data['next_page'] = $page_number + 1;

		return $data;
	}
	/**
	 * Gets information about the current user
	 *
	 * @return object   User object
	 * @return bool     False if error or no login
	 */
	static public function user_get($user_ids = null)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		$results = [];

		//no user ids provided, return current user
		if ($user_ids === null)
		{
			//$results = \Model_User::find_current();
			$me = \Model_User::find_current_id();
			$results = \Model_User::find($me);
			$results = $results->to_array();
		}
		else
		{
			if (empty($user_ids) || ! is_array($user_ids)) return Msg::invalid_input();
			//user ids provided, get all of the users with the given ids
			$me = \Model_User::find_current_id();

			foreach ($user_ids as $id)
			{
				if (Util_Validator::is_pos_int($id))
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
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! is_array($new_meta)) return Msg::invalid_input('meta');
		if (empty($new_meta)) return true;

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
	 * @param array   An array with user_id's and the perms to assign them
	 *				  Example:
	 *				  [0]
	 *             ['user_id'] => 5443
	 *             ['expiration'] => null                 // null expiration == no expiration //
	 *             ['perms'] => [ [0] => 1, [30] => 1]
	 */
	static public function permissions_set($item_type, $item_id, $perms_array)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		if ( ! Util_Validator::is_valid_hash($item_id)) return Msg::invalid_input('Invalid item id: '.$item_id);
		if (empty($perms_array)) return Msg::invalid_input('empty user perms');

		$perms_array = static::_normalize_perms($perms_array);

		$cur_user_id = \Model_user::find_current_id();

		// full perms or is super user required
		$can_give_access = Perm_Manager::user_has_any_perm_to($cur_user_id, $item_id, $item_type, [Perm::FULL]) || \Service_User::verify_session('super_user');

		// if we're changing permissions on a widget instance, have that instance on hand for checking
		$inst = false;
		$refused = [];

		// filter out any permissions I can't do
		foreach ($perms_array as &$new_perms)
		{
			// i cant do anything
			if ( ! $can_give_access && $new_perms->user_id != $cur_user_id) return Msg::no_perm();

			$old_perms = Perm_Manager::get_user_object_perms($item_id, $item_type, $new_perms->user_id);
			$requested_perm_count = count($new_perms->perms);

			// I can only reduce my perms, filter out anything that increases or adds
			if ( ! $can_give_access && $new_perms->user_id == $cur_user_id)
			{
				$new_perms = static::_filter_increasing_perms($new_perms, $old_perms);
			}

			// Toss out an error if all the perms I asked for get filtered out
			if ($requested_perm_count > 0 && count($new_perms->perms) < 1 ) return Msg::no_perm();

			// Determine what type of notification to send
			// Search perms for enabled value and get key (new_perm)
			// array_search returns false if value was not found
			// need strict type checking because 0 == false
			$new_perm   = array_search(Perm::ENABLE, $new_perms->perms);
			$is_enabled = $new_perm !== false;

			// set VIEW access for all of its assets
			if ($item_type === Perm::INSTANCE)
			{
				// get the widget instance if we don't have it yet
				if ( ! $inst) $inst = Widget_Instance_Manager::get($item_id);

				// if we're sharing the instance with a student, make sure it's okay to share with students first
				if ($is_enabled && Perm_Manager::is_student($new_perms->user_id))
				{
					// guest mode isn't enabled - don't give this student access
					if ( ! $inst->allows_guest_players())
					{
						$refused[] = $new_perms->user_id;
						continue;
					}
					Perm_Manager::set_user_game_asset_perms($item_id, $new_perms->user_id, [Perm::VISIBLE => $is_enabled], $new_perms->expiration);
				}
			}

			Perm_Manager::set_user_object_perms($item_id, $item_type, $new_perms->user_id, $new_perms->perms, $new_perms->expiration);
			$notification_mode = '';

			if ( ! $is_enabled)
			{
				$notification_mode = 'disabled';
			}
			elseif ($old_perms != [$new_perm => Perm::ENABLE])
			{
				$notification_mode = 'changed';
			}

			\Model_Notification::send_item_notification($cur_user_id, $new_perms->user_id, $item_type, $item_id, $notification_mode, $new_perm);
		}

		if (count($refused) > 0)
		{
			return Msg::student_collab();
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
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		return Perm_Manager::get_all_users_explicit_perms($item_id, $item_type);
	}

	static public function notifications_get()
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();

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

	static public function notification_delete($note_id, $delete_all)
	{
		if ( ! \Service_User::verify_session()) return Msg::no_login();

		$user = \Model_User::find_current();

		if ($delete_all)
		{
			$notes = \Model_Notification::query()
				->where('to_id', $user->id)
				->get();

			foreach ($notes as $note)
			{
				$note->delete();
			}
			return true;
		}
		if ($note_id)
		{
			$note = \Model_Notification::query()
			->where('id', $note_id)
			->where('to_id', $user->id)
			->get();

			if ($note)
			{
				$note[$note_id]->delete();
				return true;
			}
		}
		return Msg::failure('Failed to delete notification');
	}
	/**
	 * Returns all of the semesters from the semester table
	 *
	 */
	static public function semester_get()
	{
		return Semester::get_all();
	}

	static private function _validate_play_id($play_id)
	{
		$play = new Session_Play();
		$inst = self::_get_instance_for_play_id($play_id);
		if ($inst->playable_by_current_user())
		{
			if ($play->get_by_id($play_id))
			{
				if (intval($play->is_valid) == 1)
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

	/**
	 * Gets a widget instance from a play id.
	 *
	 * @param int $play_id
	 *
	 * @return Widget_Instance The current widget instance.
	 */
	static private function _get_instance_for_play_id($play_id)
	{
		$play = new Session_Play();
		$play->get_by_id($play_id);
		$inst_id = $play->inst_id;
		if ( ! ($inst = Widget_Instance_Manager::get($inst_id))) throw new \HttpNotFoundException;
		return $inst;
	}
}
