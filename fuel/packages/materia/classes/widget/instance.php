<?php

namespace Materia;

class Widget_Instance
{

	public $attempts        = -1;
	public $clean_name      = '';
	public $close_at        = -1;
	public $created_at      = 0;
	public $embed_url       = '';
	public $is_student_made = false;
	public $guest_access    = false;
	public $height          = 0;
	public $id              = 0;
	public $is_draft        = false;
	public $name            = '';
	public $open_at         = -1;
	public $play_url        = '';
	public $preview_url     = '';
	public $user_id         = 0;
	public $widget          = null;
	public $width           = 0;
	public $qset;

	public function __construct($properties=[])
	{
		// init qset
		$this->qset = (object) ['version' => null, 'data' => null];

		// load properties
		foreach ($properties as $key => $val)
		{
			if (property_exists($this, $key)) $this->{$key} = $val;
		}

		// ============ CLEAN NAME ============
		if ( ! empty($this->name))
		{
			$this->clean_name = \Inflector::friendly_title($this->name, '-', true);
		}

		// ============ URLS =============
		$base_url          = "{$this->id}/{$this->clean_name}";
		$this->preview_url = \Config::get('materia.urls.preview').$base_url;
		$this->play_url    = $this->is_draft === false ? \Config::get('materia.urls.play').$base_url : '';
		$this->embed_url   = $this->is_draft === false ? \Config::get('materia.urls.embed').$base_url : '';
	}

	// TODO: find the assets!!!
	//Widget_Asset_Manager::register_assets_to_item(Widget_Asset::MAP_TYPE_QSET, $qset_id, $recursiveQGroup->assets);
	public static function find_questions(&$source, $create_ids=false, &$questions=[])
	{
		if (is_array($source))
		{
			foreach ($source as $key => &$q)
			{
				if (self::is_question($q))
				{
					$json = json_encode($q);

					$real_q = Widget_Question::forge()->from_json($json);

					// new question sets need ids
					if ($create_ids)
					{
						if (empty($real_q->id)) $real_q->id = md5(uniqid(rand(), true));
						foreach ($real_q->answers as &$a)
						{
							if (empty($a['id'])) $a['id'] = md5(uniqid(rand(), true));
						}
						$source[$key] = json_decode(json_encode($real_q), true);
					}
					if ($real_q->id)	$questions[$real_q->id] = $real_q;
					else $questions[] = $real_q;
				}
				elseif (is_array($q))
				{
					// INCEPTION TIME!!
					self::find_questions($q, $create_ids, $questions);
				}
			}
		}
		return $questions;
	}

	public static function is_question($object)
	{
		$array = (array) $object;
		if ( ! array_key_exists('id', $array)) return false ;
		if ( ! array_key_exists('type', $array)) return false;
		if ( ! array_key_exists('questions', $array)) return false;
		if ( ! array_key_exists('answers', $array)) return false;
		if (empty($array['type']) || empty($array['questions']) || empty($array['answers']) ) return false;
		if ( ! is_array($array['answers'])) return false;
		if ( ! is_array($array['questions'])) return false;
		return true;
	}

	/**
	 * Converts the given qgroup and its child qgroups from stdclass to array
	 * @param $object_qgroup
	 * @return array
	 */
	public static function convert_to_array_qset($object_qgroup)
	{
		// if item is not an object, don't touch it
		if (is_object($object_qgroup))
		{
			$object_qgroup = (array) $object_qgroup;
		}

		if ( ! is_array($object_qgroup))
		{
			return $object_qgroup;
		}

		foreach ($object_qgroup as $key => $value)
		{
			$object_qgroup[$key] = self::convert_to_array_qset($value);
		}

		return $object_qgroup;
	}

	/**
	 * Loads the game instance from the database.
	 *
	 * @param object the database manager
	 * @param int    the id of the widget to load
	 * @param bool   whether or not to load the full qset into this instance (optional, defaults to false)
	 *
	 * @return bool true on successful location of game, false on failure
	 */
	public function db_get($inst_id, $load_qset=false, $timestamp=false)
	{
		if (\RocketDuck\Util_Validator::is_valid_hash($inst_id))
		{
			$inst = Widget_Instance_Manager::get((string) $inst_id, $load_qset, $timestamp);

			if ($inst instanceof Widget_Instance)
			{
				$this->__construct((array) $inst);
				return true;
			}
		}
		return false;
	}

	public function get_qset($inst_id, $timestamp=false)
	{
		$query = \DB::select()
			->from('widget_qset')
			->where('inst_id', $inst_id)
			->order_by('created_at', 'DESC')
			->limit(1);

		if ($timestamp) $query->where('created_at', '<=', $timestamp);

		$results = $query->execute();

		if (count($results) > 0)
		{
			$this->qset->data    = json_decode(base64_decode($results[0]['data']), true);
			$this->qset->version = $results[0]['version'];
			$this->qset->id      = $results[0]['id'];
			self::find_questions($this->qset->data);
		}
		else
		{
			$this->qset = (object) ['version' => null, 'data' => null, 'id' => null];
		}
	}

	/**
	 * Grabs the qset with the id passed in from the database.
	 */
	public function get_specific_qset($qset_id)
	{
		return \DB::select()
			->from('widget_qset')
			->where('id', $qset_id)
			->execute();
	}

	/**
	 * Writes this object's question set to the qset table and stores all the answers and assets in their appropriate tables
	 */
	private function store_qset()
	{
		try
		{
			// reserve an id for the qset
			list($qset_id, $num) = \DB::insert('widget_qset')
				->set([
					'inst_id'    => $this->id,
					'version'    => empty($this->qset->version) ? 0 : $this->qset->version,
					'created_at' => time(),
					'data'       => ''
				])
				->execute();

			if ($num > 0)
			{
				// convert qset to all arrays
				$this->qset->data = json_decode(json_encode($this->qset->data), true);

				// find any question objects and create them, updating our qsets question ids
				$questions = $this->find_questions($this->qset->data, true);

				// TODO: check to see if the qset needs to know it's own id or not... if not - do this in a single insert
				// drop in our qset id from the insert above
				$this->qset->data['id'] = $qset_id;

				// store the qset that now has question and asset ids
				$num = \DB::update('widget_qset')
					->set(['data' => base64_encode(json_encode($this->qset->data))])
					->where('id', $qset_id)
					->execute();

				// store all the questions in the qbank
				foreach ($questions as $q)
				{
					$q->db_store($qset_id);
				}
				return true;
			}
			else
			{
				trace('couldnt insert');
			}
		}
		catch (Exception $e)
		{
			trace($e);
			return false;
		}

		return false;
	}

	public function db_store()
	{
		// check for requirements
		if ( ! $this->user_id > 0) return false;

		$is_new = ! \RocketDuck\Util_Validator::is_valid_hash($this->id);

		if ($is_new) // ================ ADDING A NEW INSTANCE ===================
		{
			$tries = 3; // quick hack to deal with possible key collistion
			$success = false;

			while ( ! $success)
			{
				if ($tries-- < 0) throw new \Exception('Unable to save new widget instance');

				$hash = Widget_Instance_Hash::generate_key_hash();

				try
				{

					list($empty, $num) = \DB::insert('widget_instance')
						->set([
							'id'              => $hash,
							'widget_id'       => $this->widget->id,
							'user_id'         => $this->user_id,
							'created_at'      => time(),
							'name'            => $this->name,
							'is_draft'        => $this->is_draft,
							'height'          => $this->height,
							'width'           => $this->width,
							'open_at'         => $this->open_at,
							'close_at'        => $this->close_at,
							'attempts'        => $this->attempts,
							'guest_access'    => $this->guest_access,
							'is_student_made' => $this->is_student_made,
						])
						->execute();

					$success = $num == 1;
				}
				catch (\Fuel\Core\Database_Exception $e)
				{
					// try again till retries run out!
				}
			}

			// $success must be true to get here
			$this->id = $hash;
			Perm_Manager::set_user_object_perms($hash, Perm::INSTANCE, $this->user_id, [Perm::FULL => Perm::ENABLE]);
		}
		else // ===================== UPDATE EXISTING INSTANCE =======================
		{
			// store the question set if it hasn't already been
			\DB::update('widget_instance') // should be updated to 'widget_instance' upon implementation
				->set([
					'widget_id'    => $this->widget->id,
					'name'         => $this->name,
					'is_draft'     => $this->is_draft,
					'open_at'      => $this->open_at,
					'close_at'     => $this->close_at,
					'attempts'     => $this->attempts,
					'guest_access' => $this->guest_access,
					'updated_at'   => time()
				])
				->where('id', $this->id)
				->execute();
		}


		// =========================== NOW STORE THE QSET ====================
		if ( ! empty($this->qset->data)) $success = $this->store_qset();

		// =========================== SAVE ACTIVITY ====================
		$activity = new Session_Activity([
			'user_id' => $this->user_id,
			'type'    => $is_new ? Session_Activity::TYPE_CREATE_WIDGET : Session_Activity::TYPE_EDIT_WIDGET,
			'item_id' => $this->id,
			'value_1' => $this->name,
			'value_2' => $this->widget->id,
		]);
		$activity->db_store();

		return $success;
	}

	/**
	 * Deletes this instance from the gs_gameinstance table and places it in the gs_gameinstance_deleted table
	 * @return bool true if removed, false if unable to remove
	 */
	public function db_remove()
	{
		// remove widget instance if instance id is a valid hash and successfully removed all permissions for widget instance
		if (\RocketDuck\Util_Validator::is_valid_hash($this->id) && Perm_Manager::remove_all_permissions($this->id, Perm::INSTANCE))
		{
			\DB::update('widget_instance')
				->set(['is_deleted' => '1', 'updated_at' => time()])
				->where('id', $this->id)
				->execute();

			$activity = new Session_Activity([
				'user_id' => \Model_User::find_current_id(),
				'type'    => Session_Activity::TYPE_DELETE_WIDGET,
				'item_id' => $this->id,
				'value_1' => $this->name,
				'value_2' => $this->widget->id
			]);
			$activity->db_store();

			\Event::trigger('widget_instance_delete', $this->id);

			return true;
		}
		return false;
	}

	/**
	 * Creates a duplicate widget instance and optionally makes the current user the owner.
	 *
	 * @param string The new name of the new widget
	 * @return Widget_Instance Returns duplicate widget instance
	 */
	public function duplicate($new_name=false, $set_current_user_as_new_owner=true)
	{
		$duplicate = new Widget_Instance();
		$duplicate->db_get($this->id, true);

		$duplicate->id = 0; // mark as a new game
		if ( ! empty($new_name)) $duplicate->name = $new_name; // update name
		$result = $duplicate->db_store();
		if ($result instanceof \RocketDuck\Msg)
		{
			return $result;
		}

		// make current user owner
		if ($set_current_user_as_new_owner)
		{
			$duplicate->set_owners([\Model_User::find_current_id()]);
		}

		return $duplicate;
	}

	/** a convienent way to set the perms of this game
	 *
	 * @param array user_ids to be set as owners
	 * @param array user_ids to be set as viewers
	 * @notes this will clear out the previous owners and set the given users as the new ones
	 */
	public function set_owners($owners_list, $viewers_list = null)
	{

		// first clear out the owners and viewers
		Perm_Manager::remove_all_permissions($this->id, Perm::INSTANCE);

		// add the new owners
		for ($i = 0; $i < count($owners_list); $i++)
		{
			Perm_Manager::set_user_object_perms($this->id, Perm::INSTANCE, $owners_list[$i], [Perm::FULL => Perm::ENABLE]);
		}

		// add the new viewers
		for ($i = 0; $i < count($viewers_list); $i++)
		{
			Perm_Manager::set_user_object_perms($this->id, Perm::INSTANCE, $viewers_list[$i], [Perm::VISIBLE => Perm::ENABLE]);
		}
	}

	/**
	 * Checks if user can play widget.
	 *
	 * @return bool Whether or not the current user can play the widget
	 */
	public function playable_by_current_user()
	{
		return $this->guest_access || \Model_User::verify_session();
	}

	public function viewable_by($user_id)
	{
		return Perm_Manager::user_has_any_perm_to($user_id, $this->id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]);
	}

	/**
	 * Determine if a widget is playable
	 * @return Array List of boolean values corresponding to: open, closed, opens, closes, will_open, will_close, always_open, and has_attempts
	 *
	 */
	public function status($context_id=false)
	{
		if ( ! $context_id) $context_id = Semester::get_current_semester();
		$now           = time();
		$start         = (int) $this->open_at;
		$end           = (int) $this->close_at;
		$attempts_used = count(Score_Manager::get_instance_score_history($this->id, $context_id));

		// Check to see if any extra attempts have been provided to the user, decrement attempts_used as appropriate
		$extra_attempts = Score_Manager::get_instance_extra_attempts($this->id, \Model_User::find_current_id(), $context_id);
		$attempts_used -= $extra_attempts;

		$has_attempts  = $this->attempts == -1 || $attempts_used < $this->attempts;

		$opens       = $start > 0;
		$closes      = $end > 0;
		$always_open = ! $opens && ! $closes;
		$will_open   = $start > $now;
		$will_close  = $end > $now;
		$open        = $always_open              // unlimited availability
		  || ($start < $now && $will_close)      // now is between start and end
		  || ($start < $now && ! $closes);       // now is after start, never closes

		$closed = ! $always_open && ($closes && $end < $now);

		return [
			'open'         => $open,
			'closed'       => $closed,
			'opens'        => $opens,
			'closes'       => $closes,
			'will_open'    => $will_open,
			'will_close'   => $will_close,
			'always_open'  => $always_open,
			'has_attempts' => $has_attempts,
		];
	}

	/**
	 * Checks if widget instance allows guest players.
	 *
	 * @return bool Whether or not the widget instance allows guest players.
	 */
	public function allows_guest_players()
	{
		return $this->guest_access;
	}

	public function export()
	{
	}
}
