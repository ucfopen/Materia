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
			->where('id', 'IN', $inst_ids)
			->and_where('is_deleted', '=', '0')
			->order_by('created_at', 'desc')
			->execute()
			->as_array();

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

	public static function get_all_for_user($user_id)
	{
		$inst_ids = Perm_Manager::get_all_objects_for_user($user_id, Perm::INSTANCE, [Perm::FULL, Perm::VISIBLE]);

		if ( ! empty($inst_ids)) return Widget_Instance_Manager::get_all($inst_ids);
		else return [];
	}

	/**
	 * Checks to see if the given widget instance is locked by the current user.
	 *
	 * @param inst_id widget instance id to check for lock
	 *
	 * @return bool whether the given instance is locked by the current user
	 */
	public static function locked_by_current_user(string $inst_id): bool
	{
		$me = \Model_User::find_current_id();
		$locked_by = \Cache::easy_get('instance-lock.'.$inst_id);

		if ( ! $locked_by) return true;
		return $me && $locked_by == $me;
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
}
