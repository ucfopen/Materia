<?php

namespace Materia;

use \Materia\Util_Validator;

class Widget_Instance
{

	public $attempts        = -1;
	public $clean_name      = '';
	public $close_at        = -1;
	public $created_at      = 0;
	public $embed_url       = '';
	public $is_student_made = false;
	public $is_embedded     = false;
	public $embedded_only   = false;
	public $student_access  = false;
	public $guest_access    = false;
	public $height          = 0;
	public $id              = 0;
	public $is_draft        = false;
	public $name            = '';
	public $open_at         = -1;
	public $play_url        = '';
	public $preview_url     = '';
	public $published_by    = null;
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
		$this->is_embedded = (bool) $this->lti_associations();

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
						if (empty($real_q->id)) $real_q->id = \Str::random('uuid');
						foreach ($real_q->answers as &$a)
						{
							if (empty($a['id'])) $a['id'] = \Str::random('uuid');
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
	 * @param int $inst_id the id of the widget to load
	 * @param bool $load_qset whether or not to load the full qset into this instance (optional, defaults to false)
	 * @param int $timestamp UnixTimestamp or false, if provided, loads the newest qset before the timestamp
	 * @return bool true on successful location of game, false on failure
	 */
	public function db_get(string $inst_id, bool $load_qset = false, $timestamp = false): bool
	{
		if (Util_Validator::is_valid_hash($inst_id))
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

	/**
	 * Load the qset for this instance
	 *
	 * @param int $inst_id the id of the widget to load
	 * @param int $timestamp UnixTimestamp or false, if provided, loads the newest qset before the timestamp
	 */
	public function get_qset(string $inst_id, $timestamp=false)
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
	 * Get all the previous qsets for a given instance id
	 *
	 * @param int $inst_id the widget instance id for which to grab all qsets
	 */
	public function get_qset_history($inst_id)
	{
		$query = \DB::select()
			->from('widget_qset')
			->where('inst_id', $inst_id)
			->order_by('created_at', 'DESC');

		$results = $query->execute();

		$history = [];

		// for ($i = 0; $i < count($results); $i++)
		foreach ($results as $result)
		{
			$qset = (object) ['version' => null, 'data' => null, 'id' => null, 'created_at' => null];
			$qset->data = json_decode(base64_decode($result['data']), true);
			$qset->version = $result['version'];
			$qset->id = $result['id'];
			$qset->created_at = $result['created_at'];

			array_push($history, $qset);
		}

		return $history;
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
		if ( ! $this->is_draft && ! $this->widget->publishable_by(\Model_User::find_current_id())) return false;

		$is_new = ! Util_Validator::is_valid_hash($this->id);

		$success = false;

		if ($is_new) // ================ ADDING A NEW INSTANCE ===================
		{
			$tries = 3; // quick hack to deal with possible key collistion

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
							'is_draft'        => Util_Validator::cast_to_bool_enum($this->is_draft),
							'height'          => $this->height,
							'width'           => $this->width,
							'open_at'         => $this->open_at,
							'close_at'        => $this->close_at,
							'attempts'        => $this->attempts,
							'guest_access'    => Util_Validator::cast_to_bool_enum($this->guest_access),
							'is_student_made' => Util_Validator::cast_to_bool_enum($this->is_student_made),
							'embedded_only'   => Util_Validator::cast_to_bool_enum($this->embedded_only),
							'published_by'    => $this->is_draft ? null : \Model_User::find_current_id()
						])
						->execute();

					$success = $num == 1;
				}
				catch (\Fuel\Core\Database_Exception $e)
				{
					trace($e->getMessage());
					// try again till retries run out!
				}
			}

			// $success must be true to get here
			$this->id = $hash;
			Perm_Manager::set_user_object_perms($hash, Perm::INSTANCE, $this->user_id, [Perm::FULL => Perm::ENABLE]);
		}
		else // ===================== UPDATE EXISTING INSTANCE =======================
		{
			$new_publisher = $this->published_by;
			if ( ! $new_publisher && ! $this->is_draft) $new_publisher = \Model_User::find_current_id();

			// store the question set if it hasn't already been
			$affected_rows = \DB::update('widget_instance') // should be updated to 'widget_instance' upon implementation
				->set([
					'widget_id'     => $this->widget->id,
					'name'          => $this->name,
					'is_draft'      => Util_Validator::cast_to_bool_enum($this->is_draft),
					'open_at'       => $this->open_at,
					'close_at'      => $this->close_at,
					'attempts'      => $this->attempts,
					'guest_access'  => Util_Validator::cast_to_bool_enum($this->guest_access),
					'embedded_only' => Util_Validator::cast_to_bool_enum($this->embedded_only),
					'published_by'  => $new_publisher,
					'updated_at'    => time()
				])
				->where('id', $this->id)
				->execute();

			$success = $affected_rows > 0;
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
		if ( ! Util_Validator::is_valid_hash($this->id)) return false;

		$current_user_id = \Model_User::find_current_id();

		// does the user have full perms to be able to delete?
		if ( ! Perm_Manager::user_has_all_perms_to($current_user_id, $this->id, Perm::INSTANCE, [Perm::FULL])) return false;

		// clean up anyone's permissions
		Perm_Manager::clear_all_perms_for_object($this->id, Perm::INSTANCE);

		// notify users and allow other code to clean up before marking as deleted.
		// Once it's deleted Widget_Instance::db_get won't retrieve it.
		\Event::trigger('widget_instance_delete', ['inst_id' => $this->id, 'deleted_by_id' => $current_user_id], 'none');

		\DB::update('widget_instance')
			->set(['is_deleted' => '1', 'updated_at' => time()])
			->where('id', $this->id)
			->execute();

		// store an activity log
		$activity = new Session_Activity([
			'user_id' => $current_user_id,
			'type'    => Session_Activity::TYPE_DELETE_WIDGET,
			'item_id' => $this->id,
			'value_1' => $this->name,
			'value_2' => $this->widget->id
		]);

		$activity->db_store();

		return true;
	}

	/**
	 * Creates a duplicate widget instance and optionally makes the current user the owner.
	 *
	 * @param int owner_id user_id of the user who will be the primary owner of the duplicate
	 * @param string new_name The new name of the new widget
	 * @param bool copy_existing_perms Copy user permissions to the duplicate?
	 * @return Widget_Instance Returns duplicate widget instance
	 */
	public function duplicate(int $owner_id, string $new_name = null, bool $copy_existing_perms = false): self
	{
		$duplicate = new Widget_Instance();
		$duplicate->db_get($this->id, true);

		$duplicate->id = 0; // mark as a new game
		$duplicate->user_id = $owner_id; // set current user as owner in instance table

		if ( ! empty($new_name)) $duplicate->name = $new_name; // update name

		// if original widget is student made - verify if new owner is a student or not
		// if they have a basic_author role or above, turn off the is_student_made flag
		if ($duplicate->is_student_made)
		{
			$can_new_owner_author = Perm_Manager::does_user_have_role([Perm_Role::AUTHOR, Perm_Role::SU], $owner_id);
			if ($can_new_owner_author)
			{
				$duplicate->is_student_made = 0;
			}
		}

		$result = $duplicate->db_store();
		if ($result instanceof \Materia\Msg)
		{
			return $result;
		}

		// grab users with perms to the original, grant them perms to the copy
		if ($copy_existing_perms)
		{
			$existing_perms = Perm_Manager::get_all_users_explicit_perms($this->id, Perm::INSTANCE);
			$owners = [];
			$viewers = [];

			foreach ($existing_perms['widget_user_perms'] as $user_id => $perm_obj)
			{
				list($perm) = $perm_obj;
				if ($perm == Perm::FULL) $owners[] = $user_id;
				else if ($perm == Perm::VISIBLE) $viewers[] = $user_id;
			}

			$duplicate->set_owners($owners, $viewers);
		}

		return $duplicate;
	}

	public function get_owners()
	{
		$all_users_with_perms = \Materia\Perm_Manager::get_all_users_with_perms_to($this->id, Perm::INSTANCE);
		$owners = [];
		$current_timestamp = time();
		foreach ($all_users_with_perms as $user_id => $perm)
		{
			$not_expired = $perm[1] ? $perm[1] > $current_timestamp : true;
			if ($perm[0] == \Materia\Perm::FULL && $not_expired)
			{
				$owners[] = \Model_User::find_by_id($user_id);
			}
		}
		return $owners;
	}

	/**
	 * a convienent way to set the perms of this widget
	 *
	 * @param array user_ids to be set as owners
	 * @param array user_ids to be set as viewers
	 * @notes this will clear out the previous owners and set the given users as the new ones
	 */
	public function set_owners(array $owners_list, array $viewers_list = null)
	{
		// first clear out the owners and viewers
		Perm_Manager::clear_all_perms_for_object($this->id, Perm::INSTANCE);

		// add the new owners
		foreach ($owners_list as $owner)
		{
			Perm_Manager::set_user_object_perms($this->id, Perm::INSTANCE, $owner, [Perm::FULL => Perm::ENABLE]);
		}

		if ( ! is_array($viewers_list)) return;

		// add the new viewers
		foreach ($viewers_list as $viewer)
		{
			Perm_Manager::set_user_object_perms($this->id, Perm::INSTANCE, $viewer, [Perm::VISIBLE => Perm::ENABLE]);
		}
	}

	/**
	 * Checks if user can play widget.
	 *
	 * @return bool Whether or not the current user can play the widget
	 */
	public function playable_by_current_user()
	{
		return $this->guest_access || \Service_User::verify_session();
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
		if ( ! $context_id) $context_id = '';
		$semester = Semester::get_current_semester();

		$now           = time();
		$start         = (int) $this->open_at;
		$end           = (int) $this->close_at;
		$attempts_used = count(Score_Manager::get_instance_score_history($this->id, $context_id, $semester));

		// Check to see if any extra attempts have been provided to the user, decrement attempts_used as appropriate
		$extra_attempts = Score_Manager::get_instance_extra_attempts($this->id, \Model_User::find_current_id(), $context_id, $semester);
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
			'open'          => $open,
			'closed'        => $closed,
			'opens'         => $opens,
			'closes'        => $closes,
			'will_open'     => $will_open,
			'will_close'    => $will_close,
			'always_open'   => $always_open,
			'has_attempts'  => $has_attempts
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

	/**
	 * Checks if widget instance has any LTI associations.
	 *
	 * @return Array list of all LTI association records for this widget instance.
	 */
	public function lti_associations()
	{
		return \Lti\Model_Lti::query()
			->where('item_id', $this->id)
			->get();
	}

	public function export()
	{
	}

}
