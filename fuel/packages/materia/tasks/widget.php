<?php

namespace Fuel\Tasks;

class Widget extends \Basetask
{
	//Grants widget visibility to specified user in catalog
	public static function set_user_catalog_visibility($user_name, $widget_id, $visibility = null)
	{
		if ($user = \Model_User::query()->where('username', (string) $user_name)->get_one())
		{
			$count = \DB::select()
					->from('perm_object_to_user')
					->where('object_id', $widget_id)
					->where('user_id', $user->id)
					->execute()
					->count();
			//Removes widget visibility
			if ($count and $visibility == 'false')
			{
				\DB::delete('perm_object_to_user')
					->where('object_id', $widget_id)
					->where('user_id', $user->id)
					->execute();
				\Cli::write(\Cli::color("Widget visibility removed from user $user_name",'green'));
			}
			//Grants widget visibility
			elseif ( ! $count)
			{
				\DB::insert('perm_object_to_user')
					->columns(['object_id', 'user_id', 'perm','object_type'])
					->values([$widget_id, $user->id, 0, 3])
					->execute();
				\Cli::write(\Cli::color("Widget visibility granted to user $user_name",'green'));
			}
		}
		else
		{
			\Cli::write(\Cli::color("User $user_name does not exist",'red'));
		}
	}

	public static function share_engine_with_user($widget_id, $user_id)
	{
		\Materia\Perm_Manager::set_user_object_perms($widget_id, \Materia\Perm::WIDGET, $user_id, [\Materia\Perm::VISIBLE => \Materia\Perm::ENABLE]);
	}

	public static function copy()
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
		//$inst_id->duplicate($new_name);
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

	public static function strip_backslashes($inst_id)
	{
		// build recursive anonymous function
		$recurser = function($o, &$c) use (&$recurser)
		{
			foreach ($o as $key => $thing)
			{
				if (is_object($thing) || is_array($thing))
				{
					$recurser($thing, $c);
				}
				elseif (is_string($thing))
				{
					$old = $thing;
					$thing = str_replace('\\"','"',$thing);
					$thing = str_replace('\\\'',"'",$thing);

					if (strcmp($old, $thing) != 0)
					{
						$o->$key = $thing;

						\Cli::write(\Cli::color('Backslash removed:','yellow'));
						\Cli::write("\t".\Cli::color($old,'red')."\n\t\t=\n\t".\Cli::color($thing,'yellow'));

						$c = true;
					}
				}
			}
		};

		$inst = \Materia\Widget_Instance_Manager::get($inst_id, true);
		if ( ! $inst)
		{
			\Cli::write("Problem loading $inst_id",'red');
		}
		else
		{
			$changed = false;
			if (is_object($inst->qset->data))
			{
				$recurser($inst->qset->data, $changed);
				if ($changed)
				{
					\Cli::write("$inst_id backslashes cleaned.",'green');
					$inst->db_store();
				}
				else
				{
					\Cli::write("$inst_id is clean.",'white');
				}
			}
			else
			{
				\Cli::write("$inst_id has no qset.",'yellow');
			}
		}
	}

	public static function delete($inst_id)
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
		}
		else
		{
			\Cli::write('Deleting widget failed.', 'red');
		}
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
				\Cli::color(str_pad($engine['id'], 3, ' ', STR_PAD_LEFT).' : ', 'green').
				\Cli::color($engine['name'], 'yellow').
				\Cli::color(' '.$engine['group'], 'red')
			);
		}
	}


	public static function create_instance()
	{
		$owner = $create_stub_qset = false;

		$interactive = \Cli::option('i');
		if ( ! $interactive)
		{
			$as_user = \Cli::option('as-user');
			$engine_id = \Cli::option('engine-id');
			$widget_name = \Cli::option('widget-name');
			$owner = \Cli::option('owner');
			$create_stub_qset = \Cli::option('stub-qset');

			if ( ! $as_user || ! $engine_id || ! $widget_name)
			{
				\Cli::error('Invalid arguments!');
				\Cli::write('Examples:');
				\Cli::write('Interactive:     '.\Cli::color('php oil refine widget:create_instance -i', 'yellow'));
				\Cli::write('Non-interactive: '.\Cli::color('php oil refine widget:create_instance --as-user=1 --engine-id=20 --widget-name="Example" [--owner=2] [--qset=file.yaml | --stub-qset]', 'yellow'));
				self::quit();
			}
		}

		// Login as someone:
		if ($interactive)
		{
			\Cli::write('You need to login to do this.  Who do you want to login as?');
			$user = self::search_for_user();

			$as_user = $user->id;
		}

		\Auth::instance('Materiaauth')->force_login($as_user);

		// Get the widget details:
		if ($interactive)
		{
			\Cli::write('OK');
			self::show_engines();
			$engine_id = \Cli::prompt('Which engine?');
			$widget_name = \Cli::prompt('Widget name');
		}

		// create the widget
		$result = \Materia\API::widget_instance_new($engine_id, $widget_name, null, false);

		if ( ! $result instanceof \Materia\Widget_Instance)
		{
			\Cli::write(\Cli::color('Widget creation failed.  Server replied with:', 'red'));
			\Cli::write(print_r($result, true));
			die();
		}

		\Cli::write(\Cli::color('Widget was created', 'green'));

		// stub qset
		if ($interactive)
		{
			if (\Cli::prompt("Do you want this widget to have a stub qset?", ['n', 'y']) === 'y')
			{
				$create_stub_qset = true;
			}
		}

		if ($create_stub_qset)
		{
			$result->qset->data = [1];
			$result->db_store();
		}

		if ($interactive)
		{
			if (\Cli::prompt('Display it (print_r)?', ['y','n']) === 'y')
			{
				\Cli::write(print_r($result, true));
			}

			if (\Cli::prompt("You're the owner.  Do you want to change the owner?", ['y', 'n']) === 'y')
			{
				\Cli::write('Who should be the owner?');
				$user = self::search_for_user();
				$owner = $user->id;
			}
		}

		if ($owner)
		{
			\Cli::write('Removing you as the owner...');
			\Materia\Perm_Manager::clear_user_object_perms($result->id, \Materia\Perm::INSTANCE, \Model_User::find_current_id());

			//@TODO - Does this also change the perms for the qset???
			\Cli::write('Adding the new owner...');
			\Materia\Perm_Manager::set_user_object_perms($result->id, \Materia\Perm::INSTANCE, $owner, [\Materia\Perm::FULL => \Materia\Perm::ENABLE]);
		}

		\Cli::write(\Cli::color('Done.', 'green'));
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
					self::quit();
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
					}
					else
					{
						return $user_map[(int)$input2];
					}
				}
			}
		}
	}

	public static function import_qset($inst_id)
	{
		$file_area = \File::forge(['basedir' => null]);
		$qset_file = \Cli::option('qset');
		if ($qset_file == '')
		{
			$qset_file = \Cli::prompt('Location of the qset yaml file');
		}

		$qset_data = \Format::forge($file_area->read($qset_file, true), 'yaml')->to_array();

		$inst = self::get_widget_instance($inst_id, true);
		$inst->qset->data = $qset_data;
		if ( ! $inst->db_store())
		{
			self::abort('Importing qset failed', true);
		}
		else
		{
			\Cli::write('qset imported.', 'green');
			self::quit();
		}
	}

	public static function install($glob_str = false)
	{
		if (\Cli::option('help') || \Cli::option('?'))
		{
			\Cli::write('Installs valid .wigt packages to your Materia install.');
			\Cli::write('');
			\Cli::write('Usage: widget:install [options] [git url, .widgt file url, .wigt file path, or an entire directory]', 'white');
			\Cli::write('');
			\Cli::write('Options:', 'white');
			\Cli::write('	--validate-only (-v): Validates packages to test if they are installable. Packages won\'t be installed.');
			\Cli::write('	--upgrade (-u): Newer packages with the same name as an existing installed package will be overwritten automatically. This option has no effect if two or more existing widgets share the same name.');
			\Cli::write('	--force (-f): Will overwrite packages even if the installed package appears to be the same.');
			\Cli::write('	--db-only (-d): Installation will modify the database but won\'t install files.');
			\Cli::write('	--use-git (-g): use git to retrieve the widget when the url doesn\'t end with ".git"');
			\Cli::write('	--help (-?): Displays this message.');
			\Cli::write('');
			\Cli::write('Directory or .wigt file(s)', 'white');
			\Cli::write('If not specified this task will install all packages the widget config file.');
			\Cli::write('');

			exit();
		}

		$validate_only  = \Cli::option('validate-only') || \Cli::option('v');
		$assume_upgrade = \Cli::option('upgrade') || \Cli::option('u');
		$force          = \Cli::option('force') || \Cli::option('f');
		$db_only        = \Cli::option('db-only') || \Cli::option('d');
		$force_git      = \Cli::option('use-git') || \Cli::option('g');
		$matches        = [];
		$regex_is_git   = '/\S+\.git/';
		$regex_is_url   = '/https?:\/\/\S+\/(\S+\.wigt)/';
		$clear_output   = true;

		// Install from config
		if ( ! $glob_str)
		{
			\Cli::write('Installing from widget.php config');
			$glob_str = 'Widget Config';
			\Config::load('widgets', true);
			$matching_files = \Arr::merge(\Config::get('widgets.default'), \Config::get('widgets.custom'));
			foreach ($matching_files as $repo)
			{
				self::install($repo.' '.$glob_str);
			}
			\Cli::write('Done installing configured widgets.');
			return;
		}

		// Install from a git repository
		if ($force_git || preg_match($regex_is_git, $glob_str, $matches))
		{
			$git_url      = $matches[0];
			$git_dir      = \Inflector::friendly_title($git_url, '_', true);
			$output_dir   = PKGPATH.'materia/vendor/widget/source/'. $git_dir . '/';
			$clear_output = false;

			\Cli::write('Cloning git repository...');
			trace('installing widget from git repository', $git_url);

			if ( ! file_exists($output_dir))
			{
				// create the clone
				mkdir($output_dir, 0777, true);
				passthru("git clone {$git_url} $output_dir");
			}
			elseif (empty($_SERVER['SKIP_WIDGET_PULL']))
			{
				// update the clone
				passthru("cd $output_dir && git pull");
			}

			// just change the glob string to point at the cloned directory
			$glob_str = $output_dir.'_output/*.wigt';
		}

		// install from a url
		elseif (preg_match($regex_is_url, $glob_str, $matches))
		{
			$file_url   = $matches[0];
			$file_name  = $matches[1];
			$output_dir = self::tempdir();
			// make sure outputdir has a trailing slash
			if (substr($output_dir, -1) != '/') $output_dir .= '/';

			\Cli::write('Downloading .wigt Package...');
			trace('installing from url', $file_url);
			file_put_contents($output_dir.$file_name, fopen($file_url, 'r'));
			$glob_str = $output_dir.'*.wigt';
		}

		$matching_files = glob($glob_str);

		$num_files = count($matching_files);
		try
		{

			if ($num_files === 0)
			{
				self::end('No widgets found in '.$glob_str, true);
				return;
			}
			elseif ($num_files === 1)
			{
				self::install_one($matching_files[0], $validate_only, $assume_upgrade, $force, $db_only);
			}
			else
			{
				//install all
				foreach ($matching_files as $widget_file)
				{
					self::install_one($widget_file, $validate_only, $assume_upgrade, $force, $db_only);
				}
			}
		}
		catch (\Exception $e)
		{
			trace($e);
		}

		if (isset($output_dir) && $clear_output)
		{
			$area = \File::forge(['basedir' => null]);
			$area->delete_dir($output_dir);
		}
	}

	private static function install_one($widget_file, $validate_only = false, $assume_upgrade = false, $force = false, $db_only = false)
	{
		try
		{
			self::login_as_admin();

			$file_area = \File::forge(['basedir' => null]);
			$upgrade_id = 0;

			\Cli::write('Extracting');
			$dir = \Materia\Widget_Installer::extract_widget($widget_file);

			if ( ! $dir)
			{
				\Cli::write("Error extracting $widget_file");
				\Cli::write('Failed to extract widget', 'red');
				return;
			}

			$valid = \Materia\Widget_Installer::validate_widget($dir);

			$manifest_data = \Materia\Widget_Installer::get_manifest_data($dir);
			$records_scores = $manifest_data['score']['is_scorable'];

			// score module and test score module are now mandatory, even if they're not functional.
			$scores_valid = \Materia\Widget_Installer::validate_score_modules($dir);
			switch ($scores_valid)
			{
				case -2:
					self::abort('Missing score module file.');
					break;
				case -1:
					self::abort('Missing test score module file.');
					break;
			}

			if ($validate_only)
			{
				\Cli::write('OK!', 'green');
				return;
			}

			$clean_name = \Inflector::friendly_title($manifest_data['general']['name'], '-', true);

			$matching_widgets = \Materia\Widget_Installer::get_existing($clean_name);

			$package_hash = md5_file($widget_file);

			$num_matching_widgets = count($matching_widgets);

			if ($num_matching_widgets >= 1)
			{
				if ($assume_upgrade && $num_matching_widgets == 1)
				{
					$upgrade_id = $matching_widgets[0]['id'];
				}
				else
				{
					\Cli::write('Existing widget(s) found with name '.$clean_name.'...');
					$matching_widget_ids = [];
					foreach ($matching_widgets as $matching_widget)
					{
						$matching_widget_ids[] = $matching_widget['id'];
						\Cli::write($matching_widget['id'].' ('.$matching_widget['name'].')');
					}
					\Cli::write('What do you want to do with '.$widget_file.'?');
					$response = \Cli::prompt('(U)pgrade an existing widget, (i)nstall as a new widget, or (s)kip installing?', ['u', 'i', 's']);
					if ($response == 's')
					{
						\Cli::error($widget_file.' not installed!');
						return;
					}
					elseif ($response == 'u')
					{
						if ($num_matching_widgets == 1)
						{
							$upgrade_id = \Cli::prompt('What is the Widget ID that this new widget is upgrading?', $matching_widget_ids[0]);
						}
						else
						{
							$matching_widget_ids[] = 'other';
							$upgrade_id = \Cli::prompt('What is the Widget ID that this new widget is upgrading?', $matching_widget_ids);
							if ($upgrade_id == 'other')
							{
								$upgrade_id = \Cli::prompt('What is the Widget ID that this new widget is upgrading?');
							}
						}
					}
				}
			}

			$params = \Materia\Widget_Installer::generate_install_params($manifest_data, $package_hash);

			$demo_instance_id = null;

			// UPGRADE AN EXISTING WIDGET
			if ( ! empty($upgrade_id))
			{
				\Cli::write('Upgrading existing widget', 'green');
				$existing_widget = \Materia\Widget_Installer::upgrade_widget($upgrade_id, $params, $package_hash, $force);

				if (is_int($existing_widget))
				{
					switch ($existing_widget)
					{
						case -1:
							\Cli::write('Not upgrading since existing Widget not found: '.$widget_id, 'red');
							return;
						case -2:
							\Cli::write('Not upgrading since installed widget appears to be the same.', 'red');
							return;
						case -3:
							\Cli::write('Existing Widget not updatable: '.$widget_id, 'red');
							return;
					}
				}

				$id = $existing_widget->id;
				// keep track of the previously used instance id used for the demo
				if ($existing_widget && ! empty($existing_widget->meta_data['demo']))
				{
					$demo_instance_id = $existing_widget->meta_data['demo'];
				}
			}
			// ADD A NEW WIDGET
			else
			{
				\Cli::write('Installing brand new widget', 'green');
				list($id, $num) = \Materia\Widget_Installer::install_db($params);
			}

			\Cli::write("Existing demo id: $demo_instance_id", 'yellow');

			// ADD the Demo
			$demo_id = \Materia\Widget_Installer::install_demo($id, $dir, $demo_instance_id);

			if (is_int($demo_id))
			{
				switch ($demo_id)
				{
					case -1:
						self::abort("Couldn't upload demo assets.");
						return;
					case -2:
						self::abort('Unable to create demo instance.', true);
						return;
					default:
						self::abort("Unknown error: $demo_id", true);
						return;
				}
			}
			else
			{
				\Cli::write('Demo installed', 'green');
				$manifest_data['meta_data']['demo'] = $demo_id;
			}

			\Materia\Widget_Installer::add_manifest($id, $manifest_data);

			// move files
			if ( ! $db_only)
			{
				// move score module
				\Materia\Widget_Installer::install_widget_files($id, $manifest_data, $dir);

				// @TODO: WHITE LIST FILE TYPES ['.js', '.html', 'htm', 'png', 'jpg', 'css', 'gif', 'swf', 'flv', 'swc']
				\Cli::write("Widget installed: {$id}-{$clean_name}", 'green');
			}
			else
			{
				\Cli::write('Widget installed to database only.', 'green');
			}

		}
		catch (\Exception $e)
		{
			trace($e);
			echo $e;
			\Cli::error($widget_file.' not installed!');
		}

		\Materia\Widget_Installer::cleanup($dir);
		return;
	}


	private static function upgrade_widget($widget_id, $params, $package_hash, $force = false)
	{
		$existing_widget = new \Materia\Widget();
		$existing_widget->get($widget_id);

		if ($existing_widget->id !== $widget_id)
		{
			\Cli::write('Not upgrading since existing Widget not found: '.$widget_id, 'red');
			return false;
		}

		if ( ! $force && $existing_widget->package_hash == $package_hash)
		{
			\Cli::write('Not upgrading since installed widget appears to be the same.', 'red');
			return false;
		}

		// Ignore the existing in_catalog flag
		if (array_key_exists('in_catalog', $params))
		{
			unset($params['in_catalog']);
		}

		$num = \DB::update('widget')
			->set($params)
			->where('id', $widget_id)
			->limit(1)
			->execute();

		if ($num != 1)
		{
			\Cli::write('Existing Widget not updatable: '.$widget_id, 'red');
			return false;
		}

		// delete any existing metadata
		\DB::delete('widget_metadata')
			->where('widget_id', $widget_id)
			->execute();

		return $existing_widget;
	}

	// @TODO: duplicate EXISTS in Materia\Widget_Installer
	private static function install_demo($widget_id, $package_dir, $existing_inst_id = null)
	{
		// ADD the Demo
		if (file_exists($package_dir.'/demo.yaml'))
		{
			$demo_text = self::get_demo_text($package_dir);
			$demo_data = \Format::forge($demo_text, 'yaml')->to_array();
			self::validate_demo($demo_data);
			try
			{
				$demo_text = self::preprocess_yaml_and_upload_assets($package_dir, $demo_text);
			}
			catch (\Exception $e)
			{
				trace($e);
				self::abort("Couldn't upload demo assets.");
			}
			$demo_data = \Format::forge($demo_text, 'yaml')->to_array();

			self::login_as_admin();

			$qset = (object) ['version' => $demo_data['qset']['version'], 'data' => $demo_data['qset']['data']];
			\Cli::write("Exising demo id: $existing_inst_id", 'yellow');
			if ($existing_inst_id)
			{
				$saved_demo = \Materia\API::widget_instance_update($existing_inst_id, $demo_data['name'], $qset, false);
			}
			else
			{
				$saved_demo = \Materia\API::widget_instance_new($widget_id, $demo_data['name'], $qset, false);
			}

			if ( ! $saved_demo || $saved_demo instanceof \RocketDuck\Msg)
			{
				trace($saved_demo);
				self::abort('Unable to create demo instance.', true);
				return false;
			}
			else
			{
				return $saved_demo->id;
			}
		}
	}

	private static function preprocess_yaml_and_upload_assets($base_dir, $yaml_text)
	{
		preg_match_all('/<%\s*MEDIA\s*=\s*(\'|")(.*)(\'|")\s*%>/', $yaml_text, $matches);

		$preprocess_tags = $matches[0];
		$files_to_upload = $matches[2];
		$files_uploaded = [];
		$asset_ids = [];
		for ($i = 0; $i < count($files_to_upload); $i++)
		{
			$file = $files_to_upload[$i];
			if ( ! in_array($file, $files_uploaded))
			{
				$actual_file_path = join('/', [rtrim($base_dir, '/'), ltrim($file, '/')]);
				$asset_ids[$file] = self::sideload_asset($actual_file_path);
				$files_uploaded[] = $file;
			}

			$asset_id = $asset_ids[$file];
			$yaml_text = str_replace($preprocess_tags[$i], $asset_id, $yaml_text);
		}

		return;
	}


	private static function login_as_admin()
	{
		$admin_ids = \DB::select('id')
			->from('users')
			->join('perm_role_to_user', 'left')
				->on('users.id', '=', 'perm_role_to_user.user_id')
			->join('user_role', 'left')
				->on('user_role.role_id', '=', 'perm_role_to_user.role_id')
			->where('user_role.name', '=', \RocketDuck\Perm_Role::SU)
			->limit(1)
			->execute();

		if ($admin_ids->count() > 0)
		{
			\Auth::instance('Materiaauth')->force_login($admin_ids[0]['id']);
		}
		else
		{
			self::abort("Can't find an admin user");
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

	private static function abort($message = false, $error = false)
	{
		self::end($message, $error);
		throw new \Exception('Error: '.$message);
	}

	private static function quit($message = false, $error = false)
	{
		self::end($message, $error);
		exit();
	}

	private static function end($message = false, $error = false)
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

	protected static function list_files($dir, $filter = null)
	{
		$files = [];
		foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir)) as $f)
		{
			if ( ! preg_match('/\.{1,2}$/', $f) && ($filter == null || ! preg_match($filter, $f)))
			{
				$f = str_replace($dir, '', $f);
				$files[] = $f;
			}
		}
		return $files;
	}

	protected static function build_install_yaml($widget)
	{

		// quick function to build Yes/No strings for Yaml
		$yesno = function($input)
		{
			return $input ? 'Yes' : 'No';
		};

		if ( ! isset($widget->meta_data['about']))
		{
			$widget->meta_data['about'] = 'No Summary Data Available';
		}
		if ( ! isset($widget->meta_data['excerpt']))
		{
			$widget->meta_data['excerpt'] = 'No Summary Data Available';
		}

		$install = [
			'general' => [
				'name'                => $widget->name,
				'group'               => $widget->group,
				'height'              => $widget->height,
				'width'               => $widget->width,
				'in_catalog'          => $yesno($widget->in_catalog),
				'is_editable'         => $yesno($widget->is_editable),
				'is_playable'         => $yesno($widget->is_playable),
				'is_qset_encrypted'   => $yesno($widget->is_qset_encrypted),
				'is_answer_encrypted' => $yesno($widget->is_answer_encrypted),
				'is_storage_enabled'  => $yesno($widget->is_storage_enabled),
				'api_version'         => $widget->api_version,
			],
			'files' => [
				'creator'       => $widget->creator,
				'player'        => $widget->player,
				'flash_version' => $widget->flash_version
			],
			'score' => [
				'is_scorable'  => $yesno($widget->is_scorable),
				'score_module' => $widget->score_module,
				'logs_export_methods' => $widget->logs_export_methods
			],
			'meta_data' => $widget->meta_data,
		];

		return \Format::forge($install)->to_yaml();
	}

	protected static function build_demo_yaml($demo)
	{
		$demo = \Format::forge($demo)->to_array();
		$demo = \Arr::filter_keys($demo, ['name','qset']);

		return \Format::forge($demo)->to_yaml();
	}

	protected static function zip_files($zip_file, $file_base_dir, $files)
	{
		$zip = new \ZipArchive();
		if ($zip->open($zip_file, \ZipArchive::CREATE) === true)
		{
			// add all the files to the zip file
			foreach ($files as $file)
			{
				$zip->addFile($file_base_dir.DS.$file, $file);
			}
			$zip->close();
			\Cli::write('Widget Package Created: '.$zip_file, 'green');
		}
		else
		{
			\Cli::write('Could not create widget package', 'red');
		}
	}

	// Recurses through an array, looking for an 'assets' array.
	// If found, allows you to transform those assets via the
	// $callback function.
	protected static function transform_assets($array, $callback, $data)
	{
		foreach ($array as $key => $item)
		{
			if (is_array($item))
			{
				if (isset($item['materiaType']) && $item['materiaType'] === 'asset')
				{
					$array[$key] = $callback($item, $data);
				}
				else
				{
					$array[$key] = self::transform_assets($item, $callback, $data);
				}
			}
		}

		return $array;
	}

	public static function export_qset($inst_id)
	{
		$preserve_ids = \Cli::option('preserve-ids');

		$inst = \Materia\Widget_Instance_Manager::get($inst_id, true);

		$output_file = $inst->id.'_qset.yaml';
		if (file_exists($output_file))
		{
			$output_file = $inst->id.'_'.mt_rand().'_qset.yaml';
		}

		if ( ! $preserve_ids)
		{
			$inst->qset->data = self::strip_qset($inst->qset->data);
		}

		$qset_yaml = \Format::forge($inst->qset->data)->to_yaml();
		$file_area = \File::forge(['basedir' => null]);
		if ($file_area->create(DOCROOT, $output_file, $qset_yaml))
		{
			\Cli::write($output_file.' created', 'green');
			self::quit();
		}
	}

	public static function export_instance($inst_id)
	{
		$output_dir = $inst_id.'-exported';

		while (is_dir(DOCROOT.$output_dir))
		{
			$output_dir = $inst_id.'-'.mt_rand().'-exported';
		}
		$file_area = \File::forge(['basedir' => null]);
		$file_area->create_dir(DOCROOT, $output_dir, 0777);

		self::generate_files_for_demo(DOCROOT.$output_dir, $inst_id);
		\Cli::write('Instance files exported to '.DOCROOT.$output_dir);
	}

	protected static function generate_files_for_demo($output_dir, $inst_id)
	{
		if (file_exists($output_dir.DS.'demo.yaml')) unlink($output_dir.DS.'demo.yaml');
		$demo = \Materia\Widget_Instance_Manager::get($inst_id, true);

		$demo->qset->data = self::strip_qset($demo->qset->data, ['asset']);

		// export assets
		$data = ['output_dir' => $output_dir];
		$demo->qset->data = self::transform_assets($demo->qset->data, function($asset_arr, $data)
		{
			$asset_id = $asset_arr['id'];

			$asset = \Materia\Widget_Asset_Manager::get_asset($asset_id);

			$asset_folder = $data['output_dir'].'/_assets/';

			$file_area = \File::forge(['basedir' => null]);
			if ( ! is_dir($asset_folder))
			{
				$file_area->create_dir($data['output_dir'], '_assets');
			}

			$asset_source = PKGPATH.'materia/media/'.$asset_id.'.'.$asset->type;
			$asset_dest = $asset_folder.$asset->title;

			if ( ! file_exists($asset_dest))
			{
				$file_area->copy($asset_source, $asset_dest, 'media');
			}

			$asset_arr['id'] = '<%MEDIA="_assets/'.$asset->title.'"%>';

			return $asset_arr;
		}, $data);

		$demo_yaml = self::build_demo_yaml($demo);
		$file_area = \File::forge(['basedir' => null]);
		$file_area->create($output_dir, 'demo.yaml', $demo_yaml);
	}

	public static function export()
	{
		$instance_to_use_as_demo = \Cli::option('demo-instance', false);

		$file_area = \File::forge(['basedir' => null]);
		$widget_ids = func_get_args();
		if (count($widget_ids) === 0)
		{
			self::quit('You must specify one or more widget IDs to export', true);
		}

		if (count($widget_ids) > 1 && $instance_to_use_as_demo)
		{
			self::quit("You can't specify demo instance when exporting more than one widget", true);
		}

		foreach ($widget_ids as $widget_id)
		{
			if ( ! is_numeric($widget_id))
			{
				\Cli::write('Looking for numeric widget id, not a widget instance id (did you mean export_instance?)', 'red');
				return false;
			}

			$widget = new \Materia\Widget();
			$widget->get($widget_id);

			if ($widget->id === 0)
			{
				\Cli::write('Could not find that widget', 'red');
					return false;
			}

			if (empty($widget->dir))
			{
				\Cli::write('Could not create widget package', 'red');
				 return false;
			}

			// locate the source and output dirs
			$source_dir = \Config::get('materia.dirs.engines')."{$widget->dir}";
			if ( ! is_dir($source_dir))
			{
				\Cli::write('Could not create widget package '.$widget->dir, 'red');
				continue;
			}
			$base_dir = DOCROOT;
			$output_dir = self::tempdir();
			$file_area->copy_dir($source_dir, $output_dir);

			// clear the assets directory since we'll rebuild it
			$assets_dir = $output_dir.'/_assets/';
			if (is_dir($assets_dir))
			{
				$file_area->delete_dir($assets_dir);
				$file_area->create_dir($output_dir, '_assets', 0777);
			}

			// make a array of all the files, ignoring .yaml files
			//$files = self::list_files($source_dir);
			//\Cli::write(print_r($files, true));

			$demo = $instance_to_use_as_demo;
			if( ! $demo && isset($widget->meta_data['demo']))
			{
				$demo = $widget->meta_data['demo'];
				unset($widget->meta_data['demo']);
			}

			// build demo yaml
			if ($demo)
			{
				self::generate_files_for_demo($output_dir, $demo);
			}

			// build install yaml
			if (file_exists($output_dir.DS.'install.yaml')) unlink($output_dir.DS.'install.yaml');
			$install_yaml = self::build_install_yaml($widget);
			$file_area->create($output_dir, 'install.yaml', $install_yaml);

			// build score modules
			$score_module_path = PKGPATH.'materia/vendor/widget/score_module/'.strtolower($widget->score_module).'.php';
			$score_module_test_path = PKGPATH.'materia/vendor/widget/test/'.strtolower($widget->score_module).'.php';
			if (file_exists($score_module_path))
			{
				$new_score_module_dir = $output_dir.DS.'_score-modules';
				$new_score_module_path = $new_score_module_dir.'/score_module.php';
				$new_score_module_test_path = $new_score_module_dir.'/test_score_module.php';

				if (is_dir($new_score_module_dir)) $file_area->delete_dir($new_score_module_dir);

				$file_area->create_dir($output_dir, '_score-modules', 0777);

				$file_area->copy($score_module_path, $new_score_module_path);
				//$files[] = '_score-modules/score_module.php';
				if (file_exists($score_module_test_path))
				{
					$file_area->copy($score_module_test_path, $new_score_module_test_path);
					//$files[] = '_score-modules/test_score_module.php';
				}
			}

			// create zip file
			self::zip_files($base_dir.$widget->clean_name.'.wigt', $output_dir, self::list_files($output_dir));

			// clean up
			if (is_dir($output_dir)) $file_area->delete_dir($output_dir);
		}
	}

	public function develop($name)
	{
		exec("mkdir ".APPPATH."../../static/develop/$name; cd ".APPPATH."../../static/develop/$name; makobuild --scaffold $name html");
	}

	private static function tempdir()
	{
		$tempfile = tempnam(sys_get_temp_dir(), '');
		if (file_exists($tempfile))
		{
			unlink($tempfile);
		}
		mkdir($tempfile);
		if (is_dir($tempfile))
		{
			return $tempfile;
		}

		return false;
	}

}
