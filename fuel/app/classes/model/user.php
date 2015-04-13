<?
class Model_User extends Orm\Model
{
	const RATE_LIMITER_DOWN_TIME = 60; // 60 seconds
	const RATE_LIMITER_MAX_COUNT = 50; // 50 login attempts
	const RATE_LIMITER_WINDOW    = 60; // 60 seconds
	const GUEST_ID               = 0; // Guest id is 0

	protected static $_default_profile_fields = [
		'useGravatar' => true,
		'notify'      => true
	];

	protected static $_properties = [
		'id',
		'username',
		'first',
		'last',
		'email',
		'group',
		'last_login',
		'login_hash',
		'profile_fields' => [
			'data_type' => 'serialize'
		],
		'created_at',
		'updated_at',
	];

	protected static $_to_array_exclude = ['password', 'login_hash'];

	protected static $_observers = [
		'Orm\Observer_CreatedAt' => [
			'events' => ['before_insert'],
			'mysql_timestamp' => false,
		],
		'Orm\Observer_UpdatedAt' => [
			'events' => ['before_save'],
			'mysql_timestamp' => false,
		],
		'Orm\Observer_Self' => [
			'events' => ['before_save'],
		],
		'Orm\Observer_Typing' => [
			'events' => ['before_save', 'after_save', 'after_load']
		],
	];

	// ensure that the user has the necessary profile_fields
	public function _event_before_save()
	{
		$profile_fields = $this->get('profile_fields');

		$this->set('profile_fields', array_merge(static::$_default_profile_fields, $profile_fields));
	}

	public static function find_current()
	{
		$array = Auth::instance()->get_user_id();
		if ( empty($array)) return \Model_User::forge(array('id'=>0));
		return self::find($array[1]);
	}

	public static function find_current_id()
	{
		$array = Auth::instance()->get_user_id();
		if ( empty($array)) return self::GUEST_ID;
		return $array[1];
	}

	static public function find_by_name_search($name)
	{
		$name = preg_replace('/\s+/', '', $name); // remove spaces

		$matches = \DB::select()
			->from(\Model_User::table())
				->join("perm_role_to_user", "LEFT")
					->on(\Model_User::table().".id", "=", "perm_role_to_user.user_id")
				->join("user_role", "LEFT")
					->on("perm_role_to_user.role_id", "=", "user_role.role_id")
				->where(\Model_User::table().".id", "NOT" ,\DB::expr("IN(".
						\DB::select(\Model_User::table().".id")
							->from(\Model_User::table())
							->join("perm_role_to_user", "LEFT")
								->on(\Model_User::table().".id", "=", "perm_role_to_user.user_id")
							->join("user_role", "LEFT")
								->on("perm_role_to_user.role_id", "=", "user_role.role_id")
							->where("user_role.name", "super_user")
							->or_where("users.id", self::find_current_id())
					.")"))
				->and_where_open()
					->where('username', 'LIKE', "$name"."%")
					->or_where(\DB::expr('CONCAT(first, last)'), 'LIKE', "%$name%")
					->or_where('email', 'LIKE', "$name%")
				->and_where_close()
			->group_by(\Model_User::table().'.id')
			->as_object("Model_User")
			->execute();

		return $matches;
	}

	public static function validate($factory)
	{
		$val = Validation::forge($factory);
		$val->add_field('username', 'Username', 'required|trim|max_length[50]');
		$val->add_field('password', 'Password', 'required|trim|min_length[8]');
		$val->add_field('first', 'First Name', 'required|trim|min_length[1]');
		$val->add_field('last', 'Last Name', 'required|trim|min_length[1]');
		$val->add_field('email', 'Email', 'required|trim|max_length[255]|valid_email');
		$val->add_field('group', 'Group', 'trim|numeric');

		return $val;
	}

	public static function validate_update($factory)
	{
		$val = Validation::forge($factory);
		$val->add_field('first', 'First Name', 'required|trim|min_length[1]');
		$val->add_field('last', 'Last Name', 'required|trim|min_length[1]');
		$val->add_field('email', 'Email', 'required|trim|max_length[255]|valid_email');
		$val->add_field('group', 'Group', 'trim|numeric');

		return $val;
	}

	static public function verify_session($role_name = null)
	{
		if (\Auth::check())
		{
			$in_role = true;
			if ($role_name !== null)
			{
				if ( ! is_array($role_name)) $role_name = (array) $role_name;
				$in_role = false;
				foreach ($role_name as $role)
				{
					$in_role = \RocketDuck\Perm_Manager::does_user_have_role([$role]);
					if ($in_role) break;
				}
			}
			return (bool) $in_role;
		}
		else
		{
			\Auth::logout();
		}
		return false;
	}

	static protected function get_rate_limiter()
	{
		try
		{
			$limit = Cache::get('rate-limit.'.str_replace('.', '-', Input::real_ip()));
		}
		catch (CacheNotFoundException $e)
		{
			$limit = ['start_time' => time(), 'count' => 0];
			Cache::set('rate-limit.'.str_replace('.', '-', Input::real_ip()), $limit, self::RATE_LIMITER_DOWN_TIME);
		}
		return $limit;
	}

	static public function check_rate_limiter()
	{
		if ( ! Fuel::$is_cli)
		{
			$limit = self::get_rate_limiter();
			// relies on the native cache timeout to reset the limiter
			if ($limit['count'] >= self::RATE_LIMITER_MAX_COUNT) return false;
		}
		return true;
	}

	static protected function incement_rate_limiter()
	{
		if ( ! Fuel::$is_cli)
		{
			$limit = self::get_rate_limiter();
			if ($limit['start_time'] + self::RATE_LIMITER_WINDOW < time())
			{
				// reset
				$limit = ['start_time' => time(), 'count' => 0];
			}
			else
			{
				$limit['count'] += 1 ;
			}
			Cache::set('rate-limit.'.str_replace('.', '-', Input::real_ip()), $limit, self::RATE_LIMITER_DOWN_TIME);
		}
	}

	static protected function reset_rate_limiter()
	{
		if ( ! Fuel::$is_cli) Cache::delete('rate-limit.'.str_replace('.', '-', Input::real_ip()));
	}

	static public function login($username, $password)
	{
		Config::load('auth', true);
		foreach (Config::get('auth.driver') as $driver)
		{
			if (Auth::instance($driver)->login($username, $password)) break;
		}

		if ($logged_in = Auth::check())
		{
			self::reset_rate_limiter();
			$activity = new Materia\Session_Activity([
				'user_id' => self::find_current_id(),
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

	static public function is_guest()
	{
		if ($this->id == self::GUEST_ID)
		{
			return true;
		}
		return false;
	}

	public function to_array($custom = false, $recurse = false, $eav = false)
	{
		$avatar = \Materia\Utils::get_avatar(50, $this);
		$array = parent::to_array($custom, $recurse, $eav);
		$array['avatar'] = $avatar;
		return $array;
	}

}
