<?php

namespace Fuel\Tasks;

require_once(PKGPATH.'materia/tasks/widget.php');
use \Fuel\Tasks\Widget;

class Admin extends \Basetask
{

	protected static function convert_string_to_config_path($env, $name)
	{
		// create the env portion of the path
		// collapses if there is no env (to use the file in the top level directory)
		$env_path = empty($env) ? '' : $env.DS;

		// deal with config strings like "lti::lti.somevar"
		if (stripos($name, '::') !== false)
		{
			$name = explode('.', $name); // becomes ["lti::lti", "somevar"]
			$name = explode('::', $name[0]); // becmoes ["lti", "lti"]
			if (count($name) == 2)
			{
				// "modules/lti/conifg/production/lti.php"
				$path = APPPATH.'modules'.DS.$name[0].DS.'config'.DS.$env_path.$name[1].'.php';
			}
		}
		else
		{
			$name = explode('.', $name); // becomes ["lti", "somevar"]
			// "config/production/lti.php"
			$path = APPPATH.'config'.DS.$env_path.$name[0].'.php';
		}

		return $path;
	}

	protected static function create_directory($path)
	{
		// create config directory
		if ( ! file_exists($path))
		{
			$writable_file_perm = \Config::get('install.writable_file_perm', 0755);
			mkdir($path, $writable_file_perm, true);
			\Cli::write("'{$path}' created", 'green');
		}
	}

	protected static function copy_config_to($source, $target)
	{
		$target = APPPATH.'config'.DS.$env.DS.$config.'.php';
		self::create_directory(dirname($target));

		if ( ! file_exists($target))
		{
			copy(APPPATH.'config'.DS.$config.'.php', $target);
			\Cli::write("$target created", 'green');
		}
	}

	public static function configuration_wizard($skip_prompts=false)
	{
		\Config::load('install', true);
		$should_prompt = \Cli::option('skip_prompts', $skip_prompts) != true;
		$env = \Fuel::$env;

		// copy and files in essential_configs over
		$essential_configs = \Config::get('install.essential_configs', []);
		foreach ($essential_configs as $config)
		{
			$essential_path = self::convert_string_to_config_path($env, $config);
			self::copy_config_to(APPPATH.'config'.DS.$config.'.php', $essential_path);
		}

		$options = \Config::get('install.setup_wizard_config_options', []);
		foreach ($options as $key => $key_settings)
		{
			$config_path = self::convert_string_to_config_path($env, $key);
			self::create_directory(dirname($config_path));
			list($value_name, $new_config) = self::get_config_from_string($env, $key);

			// does this config option depends on another option's value?
			if (isset($key_settings['depends_on_value_match']))
			{
				// get the key and value out of the config
				$required_value = reset($key_settings['depends_on_value_match']);
				$required_key = key($key_settings['depends_on_value_match']);

				// load the conifg
				list($depends_key, $depends_config) = self::get_config_from_string($env, $required_key);

				// compare values and skip if they aren't the same
				$actual_value = \Arr::get($depends_config, $depends_key);

				// ajdskfl jdsfl
				if ($actual_value != $required_value)
				{
					continue;
				}
			}

			// get current value
			$new_value = $default_value = $current_value = \Arr::get($new_config, $value_name);

			// if default configured, add it as an option
			if (isset($key_settings['default']) && empty($current_value))
			{
				$default_value = $key_settings['default'];
			}

			// if no value is set and the config says generate a random key, do it here
			if (empty($default_value) && isset($key_settings['generate_random_key']) && $key_settings['generate_random_key'])
			{
				$default_value = self::make_crypto_key();
			}

			// do some work to make boolean values display better
			$current_value_string = (string) $current_value;
			if (is_bool($current_value)) $current_value_string = $current_value ? 'true' : 'false';

			$prompt_value_default = (string) $default_value;
			if (is_bool($default_value)) $prompt_value_default = $default_value ? 'true' : 'false';

			// prompt for new value
			if ($should_prompt)
			{
				// if options are set, restrict input to those options
				// we'll just copy the array into the input for the prompt
				if (isset($key_settings['options']))
				{
					$prompt_value_default = $key_settings['options'];
				}

				if ( ! empty($key_settings['description']))
				{
					\Cli::write("\r\n{$key_settings['description']}", 'yellow');
				}
				else
				{
					\Cli::write("\r\nSetting Config Variable: ${key}", 'yellow');
				}

				// show the current value if multiple options are avail
				if (is_array($prompt_value_default))
				{
					\Cli::write("Current value: \"{$current_value_string}\"");
				}

				$new_value = trim(\Cli::prompt('Enter value', $prompt_value_default));
			}
			else
			{
				// set new value to default if not prompting and a the current value is empty
				if (empty($current_value))
				{
					$new_value = $default_value;
				}
			}

			// type cast if provided
			if (isset($key_settings['type']))
			{
				$new_value = filter_var($new_value, $key_settings['type']);
			}

			if ($new_value !== $current_value)
			{
				$new_value_string = $new_value;
				if (is_bool($new_value)) $new_value_string = $new_value ? 'true' : 'false';

				\Arr::set($new_config, $value_name, $new_value);
				\Config::save($config_path, $new_config);
				\Cli::write("${key} changed from '{$current_value_string}' to '{$new_value_string}'", 'green');
			}
			else
			{
				\Cli::write("${key} remains set to '{$current_value_string}'");
			}
		}

		\Cli::write("\r\nConfiguration complete.", 'green');
		\Cli::write("\r\nPlease review the generated config files in fuel/app/config/{$env}.");
	}

	public static function make_paths_writable()
	{
		\Config::load('install', true);
		$writable_paths = \Config::get('install.writable_paths');
		$writable_file_perm = \Config::get('install.writable_file_perm');

		foreach ($writable_paths as $path)
		{
			if ( ! file_exists($path))
			{
				mkdir($path, $writable_file_perm , true);
			}

			if (chmod($path, $writable_file_perm ))
			{
				\Cli::write("Made writable: $path", 'green');
			}
			else
			{
				\Cli::write("Failed to make writable: $path", 'red');
				exit(1);
			}
		}
	}

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
		\Config::load('materia', true, true);
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
				\Cli::write(\Cli::color("password set to '{$user['password']}'", 'red'));
			}
			else
			{
				// create

				// create user
				static::new_user($user['name'], $user['first_name'], '',  $user['last_name'], $user['email'], $user['password']);
				\Cli::write("adding user {$user['name']}");
				\Cli::write(\Cli::color("password set to '{$user['password']}'", 'red'));

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
			return;
		}

		// validate the scores the game generated on the server
		if ($score_mod->validate_scores() == false)
		{
			\Cli::write('There was an error validating your score.');
			if ($update_score) $play->invalidate();
			return;
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
		foreach (\Config::get('package_paths', [PKGPATH]) as $path)
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
			if (\Cli::prompt('Destroy it all?', ['y', 'n']) != 'y') return;
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
				if (\Cli::prompt('Destroy it all?', ['y', 'n']) != 'y') continue;
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
			$q = \DB::query('INSERT INTO `perm_role_to_perm` SET `role_id` = :role_id, `perm` = :perm ON DUPLICATE KEY UPDATE `perm` = :perm');
			$q->param('role_id', $admin_role_id);
			$q->param('perm', \Materia\Perm::FULL);
			$q->execute();

			$q->param('role_id', $admin_role_id);
			$q->param('perm', \Materia\Perm::AUTHORACCESS);
			$q->execute();
		}

		\Cli::write(\Cli::color("Roles Added: $roles", 'green'));
	}

	public static function give_user_role($user_name, $group_name)
	{
		if ($user = \Model_User::query()->where('username', (string)$user_name)->get_one())
		{
			if (\RocketDuck\Perm_Manager::add_users_to_roles_system_only([$user->id], [$group_name]))
			{
				if (\Fuel::$env != \Fuel::TEST) \Cli::write(\Cli::color("$user_name now in role: $group_name", 'green'));
				return true;
			}
			else
			{
				\Cli::beep(1);
				\Cli::write(\Cli::color("couldn't add user to role", 'red'));
				exit(1);  // linux exit code 1 = error
			}
		}
		else
		{
			\Cli::beep(1);
			\Cli::write(\Cli::color("$user_name doesnt exist", 'red'));
			exit(1);  // linux exit code 1 = error
		}
	}

	public static function reset_password($username)
	{
		$newpassword = \Auth::instance()->reset_password($username);
		if (\Fuel::$env != \Fuel::TEST)
		{
			\Cli::write("New password is $username ".\Cli::color($newpassword, 'yellow'));
		}
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
				if (\Fuel::$env != \Fuel::TEST)
				{
					\Cli::beep(1);
					\Cli::write(\Cli::color('Failed to create user', 'red'));
				}
			}
			else
			{
				if (\Fuel::$env != \Fuel::TEST) \Cli::write('User Created', 'green');
				return $user_id;
			}
		}
		catch (\FuelException $e)
		{
			if (\Fuel::$env != \Fuel::TEST)
			{
				\Cli::beep(1);
				\Cli::write(\Cli::color('Error creating user', 'red'));
				\Cli::write(\Cli::color($e->getMessage(), 'red'));
			}
			exit(1); // linux exit code 1 = error
		}

	}

	public static function instant_user($name = null, $role = 'basic_author')
	{
		if ( ! empty($name))
		{
			$first = $last = $name;
			$pass = '123456';
		}
		else
		{
			$name = 'test'.\Model_User::count();
			$first = 'Unofficial Test User';
			$last = substr(str_shuffle(md5(time())),0,10); //generates a random 10-digit alphanumeric string
			$pass = 'test';
		}

		$user_id = static::new_user($name, $first, '', $last, $name.'@test.com', $pass);

		static::reset_password($name);
		static::give_user_role($name, $role);

		return $user_id;
	}

	public static function quick_test_users($n = 10)
	{
		for ($i = 0; $i < $n; $i++)
		{
			static::instant_user();
		}
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

	protected static function make_crypto_key()
	{
		$crypto = '';
		for ($i = 0; $i < 8; $i++)
		{
			$crypto .= static::safe_b64encode(pack('n', mt_rand(0, 0xFFFF)));
		}
		return $crypto;
	}

	protected static function safe_b64encode($value)
	{
		$data = base64_encode($value);
		$data = str_replace(['+', '/', '='], ['-', '_', ''], $data);
		return $data;
	}

	protected static function get_config_from_string($env, $config_string)
	{
		// converts "lti::lti.something.something_else" to "something.something_else"
		$value_name = substr($config_string, strpos($config_string, '.') + 1);
		$path = self::convert_string_to_config_path($env, $config_string);

		return [
			$value_name,
			\Config::load($path, false, true),
		];
	}
}
