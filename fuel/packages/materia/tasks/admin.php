<?php

namespace Fuel\Tasks;

class Admin extends \Basetask
{

	public static function recalculate_scores($inst_id, $user_id = null)
	{
		$query = \DB::select()
			->from('log_play')
			->where('inst_id', $inst_id);

		if ($user_id) $query->where('user_id', $user_id);

		$plays = $query->execute();

		if ($plays->count())
		{
			foreach ($plays as $play)
			{
				static::score_play($play['id'], true);
			}
		}
	}

	public static function create_default_users()
	{
		$default_users = \Config::get('materia.default_users', []);

		foreach ($default_users as $user)
		{
			// make a random password if needed
			if ( ! isset($user['password'])) $user['password'] = \Str::random('alnum', 16);

			// exists?
			$e_user = \Model_User::query()
				->where('username', '=', $user['name'])
				->get_one();

			if ($e_user)
			{
				// update?
				$e_user->first_name = $user['first_name'];
				$e_user->last_name  = $user['last_name'];
				$e_user->email      = $user['email'];
				$e_user->password   = \Auth::instance()->hash_password($user['password']);
				$e_user->save();
				\Cli::write("updating user {$user['name']}");
			}
			else
			{
				// create

				// create user
				static::new_user($user['name'], $user['first_name'], '',  $user['last_name'], $user['email'], $user['password']);
				\Cli::write("adding user {$user['name']}");

				if ( ! empty($user['roles']))
				{
					// add to roles
					foreach ($user['roles'] as $role)
					{
						static::give_user_role($user['name'], $role);
					}
				}
			}
		}
	}

	public static function score_play($play_id, $update_score = false)
	{
		$play_session = new \Materia\Session_Play();
		$play_session->get_by_id($play_id);

		$score_mod = Score_Manager::get_score_module_for_widget($play->inst_id,  $play_id);

		if ($score_mod->validate_times() == false)
		{
			\Cli::write('Timing validation error.');
			if ($update_score) $play->invalidate();
			continue;
		}

		// validate the scores the game generated on the server
		if ($score_mod->validate_scores() == false)
		{
			\Cli::write('There was an error validating your score.');
			if ($update_score) $play->invalidate();
			continue;
		}

		// Update the score values
		if ($update_score && $score_mod->finished == true)
		{
			$play_session->set_complete($score_mod->verified_score, $score_mod->total_questions, $score_mod->calculated_percent);
			\Cache::delete('play-logs.'.$play->inst_id);
		}

		\Cli::write("verified score: $score_mod->verified_score, calculated perc: $score_mod->calculated_percent");
	}

	public static function setup_migrations()
	{
		\Migrate::latest();

		// run the module migrations
		foreach (\Config::get('module_paths') as $path)
		{
			// get all modules that have files in the migration folder
			foreach (glob($path.'*/') as $m)
			{
				if (count(glob($m.\Config::get('migrations.folder').'/*.php')))
				{
					\Migrate::latest(basename($m), 'module');
				}
			}
		}

		// run the package migrations
		foreach (\Config::get('package_paths', array(PKGPATH)) as $path)
		{
			// get all packages that have files in the migration folder
			foreach (glob($path.'*/') as $m)
			{
				if (count(glob($m.\Config::get('migrations.folder').'/*.php')))
				{
					\Migrate::latest(basename($m), 'package');
				}
			}
		}

		if (\Cli::option('skip_prompts', false) === false)
		{
			\Cli::write(\Cli::color('Migrations complete', 'green'));
		}
	}

	public static function destroy_everything()
	{
		self::destroy_database();
		self::destroy_widgets();
		self::clear_cache();
	}

	public static function get_env()
	{
		\Cli::write(\Fuel::$env);
	}

	public static function destroy_widgets()
	{
		$file_area = \File::forge(['basedir' => '/']);
		if ( ! file_exists(\Config::get('materia.dirs.engines')))
		{
			\Cli::write('Widgets directory not present', 'red');
			\Cli::write(\Config::get('materia.dirs.engines'), 'red');
			return;
		}

		$dirs = $file_area->read_dir(\Config::get('materia.dirs.engines'), 1, ['!^\.', '!^\D']);
		if (count($dirs) > 0)
		{
			foreach ($dirs as $dir => $nothing)
			{
				$file_area->delete_dir(\Config::get('materia.dirs.engines').$dir);
			}
		}
		\Cli::write('Widgets uninstalled', 'green');
	}


	// This is a pretty dangerous method, careful you wield great power
	public static function destroy_database()
	{
		// Never!! allow skip in PRODUCTION
		// bypass only in TEST and when quiet is on
		$skip_prompts = (\Fuel::$env == \Fuel::TEST && \Cli::option('quiet', false) == true);
		\Cli::write('This task truncates data from ALL configured databases.', 'red');

		if ( ! $skip_prompts)
		{
			if (\Cli::prompt('Destroy it all?', array('y', 'n')) != 'y') return;
		}

		$dbs = \Config::load('db', true);
		foreach ($dbs as $db_name => $db)
		{
			// I'm not sure why this is here
			// I believe it's because the config under active is a duplicate of another db
			if ($db_name == 'active') continue;

			// Only operate on MySQL (bypasses the "redis" problem)
			if (empty($db['connection']['dsn']) || stripos($db['connection']['dsn'], 'mysql') === false) continue;

			if ( ! $skip_prompts)
			{
				\Cli::write('Truncate all tables in '.\Fuel::$env." $db_name?", 'red');
				if (\Cli::prompt('Destroy it all?', array('y', 'n')) != 'y') continue;
			}

			\DB::query('SET foreign_key_checks = 0')->execute();
			$tables = \DB::query('SHOW TABLES', \DB::SELECT)->execute($db_name);
			if ($tables->count() > 0)
			{
				foreach ($tables as $table)
				{
					$table_name = array_values($table)[0];
					\Cli::write("!!! Dropping Table: {$table_name}", 'red');
					// pause here to let the user ctrl c if they made a huge mistake
					if (\Fuel::$env != \Fuel::TEST) sleep(2);
					\DBUtil::drop_table($table_name, $db_name);
				}
			}
			\DB::query('SET foreign_key_checks = 1')->execute();
			\Cli::write("$db_name tables dropped", 'green');
		}

		// Reset the migrations and migrate up to the lates
		$migration_file = APPPATH.'/config/'.\Fuel::$env.'/migrations.php';
		if (file_exists($migration_file)) \File::delete($migration_file);
		\Cli::write('Database reset', 'green');
	}

	/**
	 * Migrations setup db structure, populate fills the default data needed to run
	 */
	public static function populate()
	{
		static::populate_roles();

		static::populate_semesters();

		static::create_default_users();
	}

	public static function populate_semesters()
	{
		include_once('semester.php');
		\Fuel\Tasks\Semester::populate('2001', '2037');
	}

	public static function populate_roles()
	{
		$roles = 0;
		if (\RocketDuck\Perm_Manager::create_role('basic_author')) $roles++;
		if (\RocketDuck\Perm_Manager::create_role('super_user')) $roles++;

		if ($admin_role_id = \RocketDuck\Perm_Manager::get_role_id('super_user'))
		{
			\DB::insert('perm_role_to_perm')
				->set([
					'role_id' => $admin_role_id,
					'perm'    => \Materia\Perm::FULL
				])
				->execute();
			\DB::insert('perm_role_to_perm')
				->set([
					'role_id' => $admin_role_id,
					'perm'    => \Materia\Perm::AUTHORACCESS
				])
				->execute();
		}


		\Cli::write(\Cli::color("Roles Added: $roles", 'green'));
	}

	public static function give_user_role($user_name, $group_name)
	{
		if ($user = \Model_User::query()->where('username', (string)$user_name)->get_one())
		{
			if (\RocketDuck\Perm_Manager::add_users_to_roles_system_only(array($user->id), array($group_name)))
			{
				\Cli::write(\Cli::color("$user_name now in role: $group_name", 'green'));
				return true;
			}
			else
			{
				\Cli::beep(1);
				\Cli::write(\Cli::color("couldn't add user to role", 'red'));
				return false;
			}
		}
		else
		{
			\Cli::beep(1);
			\Cli::write(\Cli::color("$user_name doesnt exist", 'red'));
			return false;
		}
	}

	public static function reset_password($username)
	{
		$newpassword = \Auth::instance()->reset_password($username);
		\Cli::write("New password is $username ".\Cli::color($newpassword, 'yellow'));
	}

	public static function new_user($user_name, $first_name, $mi,  $last_name, $email, $password)
	{
		try
		{
			// Auth instance must be MateriaAuth or similar auth module
			// SimpleAuth does not work!!
			$user_id = \Auth::instance('Materiaauth')->create_user($user_name, $password, $email, 1, [], $first_name, $last_name);

			if ($user_id === false)
			{
				\Cli::beep(1);
				\Cli::write(\Cli::color('Failed to create user', 'red'));
			}
			else
			{
				\Cli::write('User Created', 'green');
				return $user_id;
			}
		}
		catch (\FuelException $e)
		{
			\Cli::beep(1);
			\Cli::write(\Cli::color('Error creating user', 'red'));
			\Cli::write(\Cli::color($e->getMessage(), 'red'));
		}

	}

	public static function instant_user($name, $role = 'basic_author')
	{
		if (\Fuel::$env != \Fuel::DEVELOPMENT) return;
		$user_id = static::new_user($name, $name, 'f', $name, $name.'@test.com', '123456');
		static::reset_password($name);
		static::give_user_role($name, $role);
	}

	public static function clear_cache($quiet=false)
	{
		\Cache::delete_all();
		if ( ! $quiet) \Cli::write(\Cli::color('Cache Cleared', 'green'));
	}

	public static function anonymize_users()
	{

		$skip_user_names = func_get_args();
		if (empty($skip_user_names)) $skip_user_names = [];

		require(APPPATH.'vendor/php-faker/faker.php');

		$faker = new \Faker;

		$users = \DB::select()
			->from('users')
			->where('username', 'NOT IN', $skip_user_names)
			->execute();

		if ($users->count() > 0)
		{
			foreach ($users as $user)
			{
				\DB::update('users')
					->set([
						'username' => preg_replace('/[^a-z0-9]/i', '', $faker->Internet->user_name),
						'first'    => $faker->Name->first_name,
						'last'     => $faker->Name->surname,
						'middle'   => $faker->Name->name[0],
						'email'    => $faker->Internet->free_email,
						'password' => '',
						'salt'     => '',
					])
					->where('id', $user['id'])
					->execute();
			}
		}
	}

	public function change_db_prefix($prefix='', $remove=false)
	{
		$tables = \DB::query('SHOW TABLES', \DB::SELECT)->execute()->as_array('Tables_in_materia', 'Tables_in_materia');
		if ($remove)
		{
			foreach ($tables as $key => $t)
			{
				$rename[$key]['from'] = $t;
				$rename[$key]['to'] = preg_replace('/^'.$prefix.'/i','',$t);
			}
		}
		else
		{
			foreach ($tables as $key => $t)
			{
				$rename[$key]['from'] = $t;
				$rename[$key]['to'] = $prefix.$t;
			}
		}
		foreach ($rename as $r)
		{
			try
			{
				\DBUtil::rename_table($r['from'], $r['to']);
				\Cli::write(\Cli::color("{$r['from']} >> {$r['to']}", 'green'));
			}
			catch (\Exception $e)
			{
				//do nothing
			}
		}
	}
}
