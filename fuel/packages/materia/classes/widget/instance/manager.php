<?php

namespace Materia;

class Widget_Instance_Manager
{
	public $validate = true;

	static public function get($inst_id, $load_qset=false, $timestamp=false)
	{
		$instances = Widget_Instance_Manager::get_all([$inst_id], $load_qset, $timestamp);
		return count($instances) > 0 ? $instances[0] : false;
	}

	static public function get_all(Array $inst_ids, $load_qset=false, $timestamp=false)
	{
		if ( ! is_array($inst_ids) || count($inst_ids) < 1) return [];

		// convert all instance id's to strings... because mysql behaves unexpectedly with numbers here
		// WHERE id IN (5, 6) whould match ids that ***START*** with 5 or 6
		foreach ($inst_ids as &$value) $value = (string) $value;

		$results = \DB::select()
			->from('widget_instance')
			->where('id', 'IN', $inst_ids);
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) $results->and_where('is_deleted', '=', '0');
		$results = $results->order_by('created_at', 'desc')
			->execute()
			->as_array();

		return self::render_widgets($results, $load_qset);
	}

	private static function render_widgets($results, $load_qset)
	{
		$instances = [];
		foreach ($results as $r)
		{
			$widget = new Widget();
			$widget->get($r['widget_id']);
			$inst = new Widget_Instance([
				'id'              => $r['id'],
				'user_id'         => $r['user_id'],
				'name'            => $r['name'],
				'is_student_made' => (bool) $r['is_student_made'],
				'student_access'  => Perm_Manager::accessible_by_students($r['id'], Perm::INSTANCE),
				'guest_access'    => (bool) $r['guest_access'],
				'is_draft'        => (bool) $r['is_draft'],
				'is_deleted'      => (bool) $r['is_deleted'],
				'created_at'      => $r['created_at'],
				'open_at'         => $r['open_at'],
				'close_at'        => $r['close_at'],
				'attempts'        => $r['attempts'],
				'embedded_only'   => (bool) $r['embedded_only'],
				'widget'          => $widget,
			]);

			if ($load_qset) $inst->get_qset($inst->id, $timestamp);
			$instances[] = $inst;
		}

		return $instances;
	}

	private static function get_set(Array $inst_ids, $offset, $query=false)
	{
		if ( ! is_array($inst_ids) || count($inst_ids) < 1) return [];

		$results = \DB::select()
			->from('widget_instance')
			->where('id', 'IN', $inst_ids);
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) $results->and_where('is_deleted', '=', '0');
		if ($query) $results->and_where('name', 'LIKE', '%'.$query.'%');
		$results = $results->order_by('created_at', 'desc')
			->offset($offset)
			->limit(10)
			->execute()
			->as_array();

		return self::render_widgets($results, false);
	}

	public static function get_all_for_user($user_id, $offset)
	{
		$inst_ids = Perm_Manager::get_all_objects_for_user($user_id, Perm::INSTANCE, [Perm::FULL, Perm::VISIBLE]);
		$inst_count = count($inst_ids);
		// if ( ! empty($inst_ids)) return Widget_Instance_Manager::get_all($inst_ids);
		if ( ! empty($inst_ids) && $inst_count >= $offset)
		{
			$r = new \stdClass();
			$r->widgets = Widget_Instance_Manager::get_set($inst_ids, $offset);
			$r->total = $inst_count;
			return $r;
		}
		return [];
	}

	/**
	 * Locks a widget instance for 2 minutes to prevent others from editing it.
	 * Renew your locks by calling lock at least once per 2 minutes
	 *
	 * @param inst_id widget instance id to lock
	 */
	public static function lock($inst_id)
	{
		$me = \Model_User::find_current_id();

		$locked_by = \Cache::easy_get('instance-lock.'.$inst_id);
		if (is_null($locked_by))
		{
			// not currently locked by anyone else
			$locked_by = $me;
			\Cache::set('instance-lock.'.$inst_id, $locked_by, \Config::get('materia.lock_timeout'));
		}

		// true if the lock is mine
		return $locked_by == $me;
	}

	public static function search_for_user($user_id, $query)
	{
		$inst_ids = Perm_Manager::get_all_objects_for_user($user_id, Perm::INSTANCE, [Perm::FULL, Perm::VISIBLE]);
		if ( ! empty($inst_ids) )
		{
			$r = new \stdClass();
			$r->widgets = Widget_Instance_Manager::get_set($inst_ids, 0, $query);
			$r->total = count($r->widgets);
			return $r;
		}
		return [];
	}
}
