<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Service_User
{

	use \Trait_RateLimit;


	static public function verify_session($role_or_roles = null)
	{
		if ( ! \Auth::check())
		{
			\Auth::logout();
			return false;
		}

		if ( $role_or_roles === null) return true;

		if ( ! is_array($role_or_roles)) $role_or_roles = (array) $role_or_roles;
		return \Materia\Perm_Manager::does_user_have_role($role_or_roles);
	}

	static public function login($username, $password)
	{
		$bypass_used = \Session::get_flash('bypass', false);
		//don't process this if the current auth package restricts normal logins
		if (\Config::get('auth.restrict_logins_to_lti_single_sign_on', false) && ! $bypass_used) throw new \HttpServerErrorException;

		Config::load('auth', true);
		foreach (Config::get('auth.driver') as $driver)
		{
			if (Auth::instance($driver)->login($username, $password)) break;
		}

		if ($logged_in = Auth::check())
		{
			self::reset_rate_limiter();
			$activity = new Materia\Session_Activity([
				'user_id' => Model_User::find_current_id(),
				'type'    => Materia\Session_Activity::TYPE_LOGGED_IN
			]);
			$activity->db_store();
		}
		else
		{
			self::incement_rate_limiter();
		}
		return $logged_in;
	}

	// Updates a user's properties
	public static function update_user($user_id, $new_props)
	{
		$user = Model_User::find($user_id);
		if (empty($user)) throw new \HttpNotFoundException;

		$report = [];
		$is_student = \Materia\Perm_Manager::is_student($user->id);

		if ($new_props->is_student == $is_student)
		{
			$report['is_student'] = true;
		}
		else
		{
			//update_role's second argument is true for employee, false for student
			//returning the opposite of the user's 'is a student' status covers this case
			\Auth_Login_Materiaauth::update_role($user->id, ! $new_props->is_student);
			$activity = new \Materia\Session_Activity([
				'user_id' => \Model_User::find_current_id(),
				'type'    => \Materia\Session_Activity::TYPE_ADMIN_EDIT_USER,
				'item_id' => $user->id,
				'value_1' => 'is_student',
				'value_2' => $is_student,
				'value_3' => $new_props->is_student
			]);
			$activity->db_store();
		}
		unset($new_props->is_student);

		foreach ($new_props as $prop => $val)
		{
			$clean_prop = ucwords(str_replace('_', ' ', $prop));
			$result = $user->set_property($prop, $val);
			$report[$prop] = $result ? true : '"'.$clean_prop.'" update failed!';
		}

		return $report;
	}

	/**
	 * Retreives widget instances played by a given user
	 *
	 * @param int The ID of the desired user
	 *
	 * @return array A list of played instances and other relevant data for the given user.
	 */
	public static function get_played_inst_info($user_id)
	{
		$results = \DB::select(
				\DB::expr('p.id AS play_id'),
				\DB::expr('w.id AS widget'),
				'i.name',
				'i.id',
				'p.created_at',
				'p.elapsed',
				'p.is_complete',
				'p.percent',
				'p.auth'
			)
			->from(['log_play', 'p'])
			->join(['widget_instance', 'i'])
				->on('i.id', '=', 'p.inst_id')
			->join(['widget', 'w'])
				->on('w.id', '=', 'i.widget_id')
			->where('p.user_id', $user_id)
			->order_by('p.created_at', 'DESC')
			->order_by('i.created_at', 'DESC')
			->as_object()
			->execute();

		$return = [];
		foreach ($results as $r)
		{
			$widget = new \Materia\Widget;
			$widget->get($r->widget);
			$r->widget = $widget;
			$return[] = $r;
		}

		return $return;
	}
}
