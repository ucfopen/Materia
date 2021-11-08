<?php
class Model_User extends Orm\Model
{
	const GUEST_ID = 0; // Guest id is 0

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
		'password',
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
		//don't allow notifications to be sent if there's no e-mail address to send them to
		if (empty($this->email)) $this->profile_fields['notify'] = false;
	}

	public static function find_current()
	{
		$array = Auth::instance()->get_user_id();
		if ( empty($array)) return self::forge_guest();
		return self::find($array[1]);
	}

	public static function find_current_id()
	{
		$array = Auth::instance()->get_user_id();
		if ( empty($array)) return self::GUEST_ID;
		return $array[1];
	}

	public static function find_by_id($id)
	{
		return \Model_User::query()
			->where('id', $id)
			->get_one();
	}

	public static function find_by_username($username)
	{
		return \Model_User::query()
			->where('username', (string) $username)
			->get_one();
	}

	static public function find_by_name_search($name)
	{
		$name = preg_replace('/\s+/', '', $name); // remove spaces

		$user_table = \Model_User::table();
		$matches = \DB::select()
			->from($user_table)
			->where($user_table.'.id', 'NOT', \DB::expr('IN('.\DB::select($user_table.'.id')
				->from($user_table)
				->join('perm_role_to_user', 'LEFT')
				->on($user_table.'.id', '=', 'perm_role_to_user.user_id')
				->join('user_role', 'LEFT')
				->on('perm_role_to_user.role_id', '=', 'user_role.role_id')
				->where('user_role.name', 'super_user')
				->or_where('users.id', self::find_current_id()).')'))
			->and_where_open()
				->where('username', 'LIKE', $name.'%')
				->or_where(\DB::expr('REPLACE(CONCAT(first, last), " ", "")'), 'LIKE', "%$name%")
				->or_where('email', 'LIKE', "$name%")
			->and_where_close()
			->limit(50)
			->as_object('Model_User')
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

	public function is_guest()
	{
		if ($this->id == self::GUEST_ID)
		{
			return true;
		}
		return false;
	}

	static protected function forge_guest()
	{
		return \Model_User::forge(['id' => self::GUEST_ID]);
	}

	public function to_array($custom = false, $recurse = false, $eav = false)
	{
		$avatar = \Materia\Utils::get_avatar(50, $this);
		$array = parent::to_array($custom, $recurse, $eav);
		$array['avatar'] = $avatar;
		$array['is_student'] = \Materia\Perm_Manager::is_student($this->id);
		return $array;
	}

	public function get_property($prop)
	{
		// check to see if the given property is attached directly to the object
		if (isset($this->$prop)) return $this->$prop;
		// if not, it's probably in profile fields
		if (isset($this->profile_fields[$prop])) return $this->profile_fields[$prop];

		return null;
	}

	public function set_property($prop, $new_val)
	{
		if ( ! \Materia\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;

		$original_val = $this->get_property($prop, $new_val);
		if ($original_val == $new_val) return true;
		if (isset($this->$prop))
		{
			$this->$prop = $new_val;
		}
		else
		{
			$this->profile_fields[$prop] = $new_val;
		}

		$this->save();

		$activity = new \Materia\Session_Activity([
			'user_id' => \Model_User::find_current_id(),
			'type'    => \Materia\Session_Activity::TYPE_ADMIN_EDIT_USER,
			'item_id' => $this->id,
			'value_1' => $prop,
			'value_2' => $original_val,
			'value_3' => $new_val,
		]);
		$activity->db_store();

		return true;
	}
}
