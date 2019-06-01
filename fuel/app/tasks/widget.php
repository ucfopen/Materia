<?php

namespace Fuel\Tasks;

class Widget extends \Basetask
{

	public static function copy_instance()
	{
		// Login as someone:
		\Cli::write('You need to login to do this.  Who do you want to login as?');
		$user = self::search_for_user();
		\Auth::instance('Materiaauth')->force_login($user->id);

		$inst_id = \Cli::prompt('Widget ID');
		$inst = self::get_widget_instance($inst_id);
		$default_name = $inst->name.' (copy)';
		$new_name = \Cli::prompt('New widget name ['.$default_name.']');
		if ($new_name == '')
		{
			$new_name = $default_name;
		}

		\Materia\API::widget_instance_copy($inst_id, $new_name);
	}

	public static function show_instance($inst_id)
	{
		$inst = \Materia\Widget_Instance_Manager::get($inst_id, true);

		if (\Cli::option('dump'))
		{
			\Cli::write(print_r($inst));
		}
		else
		{
			\Cli::write(\Cli::color('Widget Instance Info:','green'));
			// print out all the variables
			foreach ($inst as $prop => $val)
			{
				if (is_array($val) || is_object($val)) $val = '{'.gettype($val).'}';
				\Cli::write(\Cli::color("$prop: ", 'green').\Cli::color($val, 'yellow'));
			}
		}
	}

	public static function show_qset($inst_id)
	{
		$inst = new \Materia\Widget_Instance();
		$inst->get_qset($inst_id);

		\Cli::write(print_r($inst->qset->data));
	}


	public static function delete_instance($inst_id)
	{
		if (\Cli::prompt(\Cli::color('Are you sure? [yes/NO]', 'red')) !== 'yes')
		{
			die('Operation aborted');
		}

		$inst = self::get_widget_instance($inst_id);
		\Materia\Perm_Manager::clear_all_perms_for_object($inst->id, \Materia\Perm::INSTANCE);
		$result = $inst->db_remove();

		if ($result)
		{
			\Cli::write('Widget deleted.', 'green');
			exit(0);
		}

		\Cli::write('Deleting widget failed.', 'red');
		exit(1); // linux exit code 1 = error
	}

	public static function show_engines()
	{
		$engines = \DB::select()
				->from('widget')
				->order_by('name')
				->execute()
				->as_array();

		foreach ($engines as $engine)
		{
			\Cli::write(
				\Cli::color(str_pad($engine['id'], 3, ' ', STR_PAD_LEFT).' : ', 'green').\Cli::color($engine['name'], 'yellow').\Cli::color(' '.$engine['group'], 'red')
			);
		}
	}

	private static function search_for_user()
	{
		while (true)
		{
			$input = \Cli::prompt('Search for user (name/login)');
			if ($input == '')
			{
				if (\Cli::prompt('Exit?', ['y', 'n']) === 'y')
				{
					exit();
				}
			}
			else
			{
				$result = \Model_User::find_by_name_search($input);
				if (count($result) === 0)
				{
					\Cli::write('No matching users found.');
				}
				elseif (count($result) === 1)
				{
					\Cli::write('Found:');
					\Cli::write(self::print_user($result[0]));
					if (\Cli::prompt('Accept this result?', ['y', 'n']) === 'y')
					{
						return $result[0];
					}
				}
				else
				{
					\Cli::write('Found multiple:');
					$user_map = [];
					for ($i = 0; $i < count($result); $i++)
					{
						$user_map[$result[$i]->id] = $result[$i];
						\Cli::write(self::print_user($result[$i]));
					}
					$input2 = \Cli::prompt('Which?');
					if ( ! is_numeric($input2) || ! isset($user_map[(int)$input2]))
					{
						\Cli::write('Invalid input, try again.');
						exit(1); // linux exit code 1 = error
					}
					else
					{
						return $user_map[(int)$input2];
					}
				}
			}
		}
	}

	public static function download_package($file_url)
	{
		$file_name  = basename($file_url);
		$output_dir = \Materia\Widget_Installer::get_temp_dir();

		\Cli::write("Downloading .wigt Package $file_url");

		file_put_contents($output_dir.$file_name, fopen($file_url, 'r'));
		\Cli::write("package downloaded: {$output_dir}{$file_name}");

		return $output_dir.$file_name;
	}

	public static function install_from_url(string $package_url, string $checksum_url, ?int $desired_id = null): void
	{
		$local_package = static::download_package($package_url);
		$local_checksum = static::download_package($checksum_url);
		$valid = static::validate_checksum($local_package, $local_checksum);

		\Cli::set_option('replace-id', $desired_id);
		if ($valid) static::install($local_package);
	}

	protected static function validate_checksum(string $wigt_path, string $checksum_path): bool
	{
		$file_area = \File::forge(['basedir' => null]);
		$checksums = \Format::forge($file_area->read($checksum_path, true), 'yaml')->to_array();
		$sha_hash = hash_file('sha256', $wigt_path);

		if ($sha_hash !== $checksums['sha256'])
		{
			\Cli::write('Error: sha256 checksum mis-match!!');
			return false;
		}

		\Cli::write('Checksum Valid');
		\Cli::write("Build date: {$checksums['build_date']}");
		\Cli::write("Git Source: {$checksums['git']}");
		\Cli::write("Git Commit: {$checksums['git_version']}");
		return true;
	}

	public static function install_from_config()
	{
		$widgets = \Config::get('widgets');
		foreach ($widgets as $w)
		{
			static::install_from_url($w['package'], $w['checksum'], $w['id']);
		}
	}

	public static function extract_from_config()
	{
		$widgets = \Config::get('widgets');
		foreach ($widgets as $index => $w)
		{
			static::extract_from_url_without_install($w['package'], $w['checksum'], $w['id']);
		}
	}

	// must be passed .wigt file references, can use glob syntax to match multiple widgets
	public static function install()
	{
		if (\Cli::option('help') || \Cli::option('?'))
		{
			\Cli::write('Installs valid .wigt packages to your Materia install.');
			\Cli::write('');
			\Cli::write('Usage: widget:install [options] [git url, .widgt file url, .wigt file path, or an entire directory]', 'white');
			\Cli::write('');
			\Cli::write('Options:', 'white');
			\Cli::write('	--skip-upgrade: If there is a package with the same name, do not upgrade it.');
			\Cli::write('	--replace-id: Set a widget id youd like to replace.');
			\Cli::write('	--help (-h): Displays this message.');
			\Cli::write('');
			\Cli::write('Directory or .wigt file(s)', 'white');
			\Cli::write('');
			exit(0);
		}

		# parse all the file paths passed to the task
		$widget_files = static::get_files_from_args(func_get_args());

		$replace_id = (int) \Cli::option('replace-id');
		$count = count($widget_files);

		if ( ! $count)
		{
			self::write('No widgets found in '.implode(',', func_get_args()), true);
			return;
		}

		if ($count > 1 && $replace_id > 0)
		{
			\Cli::error('multiple widgets paths can not be combined with --replace-id option');
			exit(1); // linux exit code 1 = error
		}

		self::login_as_admin();

		foreach ($widget_files as $file)
		{
			$success = \Materia\Widget_Installer::extract_package_and_install($file, \Cli::option('skip-upgrade'), $replace_id);
			if ($success !== true) exit(1); // linux exit code 1 = error
		}
	}

	// This function will verify and extract the widget files without installing
	// This is primarily used to deposit expanded widgets into a production Docker Container
	public static function extract_without_install(int $id, string $package_path): void
	{
		$success = \Materia\Widget_Installer::extract_package_files($package_path, $id);
		\Cli::write('Widget '.($success ? 'installed' : 'not installed'));
		if ($success !== true) exit(1); // linux exit code 1 = error
	}

	// This function will verify and extract the widget files without installing
	// This is primarily used to deposit expanded widgets into a production Docker Container
	public static function extract_from_url_without_install(string $package_url, string $checksum_url, int $id): void
	{
		$local_package = static::download_package($package_url);
		$local_checksum = static::download_package($checksum_url);
		$valid = static::validate_checksum($local_package, $local_checksum);

		if ($valid)
		{
			$success = \Materia\Widget_Installer::extract_package_files($local_package, $id);
			\Cli::write('Widget '.($success ? 'installed' : 'not installed'));
			if ($success !== true) exit(1); // linux exit code 1 = error
		}
	}

	private static function login_as_admin()
	{
		$admin_ids = \DB::select('id')
			->from('users')
			->join('perm_role_to_user', 'left')
				->on('users.id', '=', 'perm_role_to_user.user_id')
			->join('user_role', 'left')
				->on('user_role.role_id', '=', 'perm_role_to_user.role_id')
			->where('user_role.name', '=', \Materia\Perm_Role::SU)
			->limit(1)
			->execute();

		if ($admin_ids->count() > 0)
		{
			\Auth::instance()->force_login($admin_ids[0]['id']);
		}
		else
		{
			self::write("Can't find an admin user", true);
			exit(1); // linux exit code 1 = error
		}
	}

	private static function print_user($user)
	{
		return $user->id.':'.$user->username." - '".$user->first.' '.$user->last."' [".$user->email.']';
	}

	private static function get_widget_instance($inst_id, $load_qset = false)
	{
		$inst = new \Materia\Widget_Instance();
		$inst->db_get($inst_id, $load_qset);
		return $inst;
	}

	private static function write($message = false, $error = false, $exception = false)
	{
		if ($message)
		{
			if ($error)
			{
				\Cli::error($message);
			}
			else
			{
				\Cli::write($message);
			}
		}

		if ($exception)
		{
			throw new \Exception("Error: $message");
		}
	}

	public static function export_qset($inst_id)
	{
		$preserve_ids = \Cli::option('preserve-ids');

		$inst = \Materia\Widget_Instance_Manager::get($inst_id, true);

		if ( ! $preserve_ids)
		{
			$inst->qset->data = self::strip_qset($inst->qset->data);
		}

		$qset_yaml = \Format::forge($inst->qset->data)->to_yaml();

		\Cli::write($qset_yaml);
		exit(1);
	}

	/**
	 * Removes ids from a qset
	 *
	 * @param object $qset The qset to strip
	 * @param array $excluded_types List of materiaTypes to exclude (i.e. 'asset')
	 * @param array $excluded_keys List of keys to avoiding stripping (i.e. 'option')
	 */
	protected static function strip_qset($qset, $excluded_types = [], $excluded_keys = ['option'])
	{
		$inception = function(&$input, $method, $excluded_types, $excluded_keys){
			foreach ($input as $key => &$value)
			{
				if (in_array($key, $excluded_keys))
				{
					continue;
				}
				if (isset($value['materiaType']) && in_array($value['materiaType'], $excluded_types))
				{
					continue;
				}

				if ($value === '')
				{
					unset($input[$key]);
				}
				elseif ($key === 'id' || $key === 'user_id' || $key === 'created_at')
				{
					unset($input[$key]);
				}
				elseif (is_array($value) || is_object($value))
				{
					if (is_array($value) && empty($value)) unset($input[$key]);
					else $method($value, $method, $excluded_types, $excluded_keys);
				}
			}

		};

		$inception($qset, $inception, $excluded_types, $excluded_keys);
		return $qset;
	}
}
