<?php

namespace Fuel\Tasks;

class Widget  extends \Basetask
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
		\Auth::instance('SimpleAuth')->force_login($user->id);

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

		\Auth::instance('SimpleAuth')->force_login($as_user);

		// Get the widget details:
		if ($interactive)
		{
			\Cli::write('OK');
			self::show_engines();
			$engine_id = \Cli::prompt('Which engine?');
			$widget_name = \Cli::prompt('Widget name');
		}

		// create the widget
		$result = \Materia\API::widget_instance_save($engine_id, $widget_name, null, false);

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

	private static function extract_widget($widget_file)
	{
		$extract_location = self::tempdir();
		if ( ! $extract_location)
		{
			self::end('Unable to extract widget.', true);
			return false;
		}

		// assume it's a zip, attempt to extract
		try
		{
			\Cli::write('Extracting');
			$zip = new \ZipArchive();
			$zip->open($widget_file);
			$zip->extractTo($extract_location);
			$zip->close();
			return realpath($extract_location);
		}
		catch (\Exception $e)
		{
			// clean up after ourselves by removing the extracted directory.
			\Cli::write("Error extracting $widget_file to $extract_location");
			\Cli::write('Error: '.$e->getMessage());
			$file_area = \File::forge(['basedir' => null]);
			$file_area->delete_dir($extract_location);
		}

		return false;
	}

	private static function get_widget_by_clean_name($clean_name)
	{
		$engine = \DB::select()
					->from('widget')
					->where('clean_name', $clean_name)
					->execute()
					->as_array();

		return $engine;
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
			$git_url    = $matches[0];
			$output_dir = self::tempdir();
			\Cli::write('Cloning git repository...');
			trace('installing widget from git repository', $git_url);
			passthru("git archive --remote=$git_url HEAD _output/ | tar -x -C $output_dir/");

			// make sure outputdir has a trailing slash
			if (substr($output_dir, -1) != '/') $output_dir .= '/';

			// just change the glob string to point at the cloned directory
			$glob_str = $output_dir.'**/*.wigt';
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

		if (isset($output_dir))
		{
			$area = \File::forge(['basedir' => null]);
			$area->delete_dir($output_dir);
		}
	}

	private static function install_one($widget_file, $validate_only = false, $assume_upgrade = false, $force = false, $db_only = false)
	{
		try {
			$file_area = \File::forge(['basedir' => null]);
			$upgrade_id = 0;
			$dir = self::extract_widget($widget_file);
			self::validate_widget($dir);
			$manifest_data = self::get_manifest_data($dir);
			$records_scores = $manifest_data['score']['is_scorable'];

			// score module and test score module are now mandatory, even if they're not functional.
			self::validate_score_modules($dir);

			if ($validate_only)
			{
				\Cli::write('OK!', 'green');
				return;
			}

			$clean_name = \Inflector::friendly_title($manifest_data['general']['name'], '-', true);

			$matching_widgets = self::get_widget_by_clean_name($clean_name);

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

			$params = [
				'name'                => $manifest_data['general']['name'],
				'created_at'          => time(),
				'group'               => $manifest_data['general']['group'],
				'flash_version'       => $manifest_data['files']['flash_version'],
				'height'              => $manifest_data['general']['height'],
				'width'               => $manifest_data['general']['width'],
				'is_qset_encrypted'   => (string)(int)$manifest_data['general']['is_qset_encrypted'],
				'is_answer_encrypted' => (string)(int)$manifest_data['general']['is_answer_encrypted'],
				'is_storage_enabled'  => (string)(int)$manifest_data['general']['is_storage_enabled'],
				'is_playable'         => (string)(int)$manifest_data['general']['is_playable'],
				'is_editable'         => (string)(int)$manifest_data['general']['is_editable'],
				'is_scorable'         => (string)(int)$records_scores,
				'in_catalog'          => (string)(int)$manifest_data['general']['in_catalog'],
				'clean_name'          => $clean_name,
				'api_version'         => (string)(int)$manifest_data['general']['api_version'],
				'package_hash'        => $package_hash,
				'score_module'        => $manifest_data['score']['score_module']
			];

			if (isset($manifest_data['files']['creator']))
			{
				$params['creator'] = $manifest_data['files']['creator'];
			}
			if (isset($manifest_data['files']['player']))
			{
				$params['player'] = $manifest_data['files']['player'];
			}

			$demo_instance_id = null;

			// UPGRADE AN EXISTING WIDGET
			if ( ! empty($upgrade_id))
			{
				\Cli::write('Upgrading exising widget', 'green');
				$existing_widget = self::upgrade_widget($upgrade_id, $params, $package_hash, $force);
				if ( ! $existing_widget)
				{
					return;
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
				list($id, $num) = \DB::insert('widget')
					->set($params)
					->execute();
			}

			// ADD the Demo
			if ($demo_id = self::install_demo($id, $dir, $demo_instance_id))
			{
				\Cli::write('Demo installed', 'green');
				$manifest_data['meta_data']['demo'] = $demo_id;
			}

			// add in the metadata
			foreach ($manifest_data['meta_data'] as $metadata_key => $metadata_value)
			{
				if (is_array($metadata_value))
				{
					foreach ($metadata_value as $metadata_child_item)
					{
						self::insert_metadata($id, $metadata_key, $metadata_child_item);
					}
				}
				else
				{
					self::insert_metadata($id, $metadata_key, $metadata_value);
				}
			}

			// move files
			if ( ! $db_only)
			{
				// move score module
				$score_module_clean_name = strtolower(\Inflector::friendly_title($manifest_data['score']['score_module'])).'.php';
				$new_score_module = PKGPATH.'materia/vendor/widget/score_module/'.$score_module_clean_name;
				if (file_exists($new_score_module))
				{
					$file_area->delete($new_score_module);
				}
				$file_area->rename($dir.'/_score-modules/score_module.php', $new_score_module);

				// move test
				$new_test = PKGPATH.'materia/vendor/widget/test/'.$score_module_clean_name;
				if (file_exists($new_test))
				{
					$file_area->delete($new_test);
				}
				$file_area->rename($dir.'/_score-modules/test_score_module.php', $new_test);

				// move spec to the main materia spec folder, if it exists
				$widgetspec = $dir.'/spec/spec.coffee';
				if (file_exists($widgetspec)) {
					$new_spec = "spec/widgets/$clean_name.spec.coffee";
					if (file_exists($new_spec))
					{
						$file_area->delete($new_spec);
					}
					$file_area->rename($widgetspec, $new_spec);
				}

				// delete the score modules folder so it won't get copied over
				$file_area->delete_dir($dir.'/_score-modules');

				// move widget files
				// public_widget_dir
				$new_dir = \Config::get('materia.dirs.engines')."{$id}-{$clean_name}";
				if (is_dir($new_dir)) $file_area->delete_dir($new_dir);
				$file_area->copy_dir($dir, $new_dir);

				// @TODO: WHITE LIST FILE TYPES ['.js', '.html', 'htm', 'png', 'jpg', 'css', 'gif', 'swf', 'flv', 'swc']
				\Cli::write("Widget installed: {$id}-{$clean_name}", 'green');
			}
			else
			{
				\Cli::write('Widget installed to database only.', 'green');
			}

			$file_area->delete_dir($dir);
		}
		catch (\Exception $e)
		{
			trace($e);
			\Cli::error($widget_file.' not installed!');
			$file_area->delete_dir($dir);
			return;
		}

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
			$saved_demo = \Materia\API::widget_instance_save($widget_id, $demo_data['name'], $qset, false, $existing_inst_id);
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

		return $yaml_text;
	}

	// "uploads" an asset
	private static function sideload_asset($file)
	{
		try
		{
			$file_area = \File::forge(['basedir' => null]);
			$ext = pathinfo($file, PATHINFO_EXTENSION);
			// we need to move the file manually to the media/uploads directory
			// so process_upload can move it to the correct place
			$new_temp_filepath = \Config::get('materia.dirs.media').'uploads/'.uniqid().'.'.$ext;
			$file_area->copy($file, $new_temp_filepath);
			$asset = \Materia\Widget_Asset_Manager::process_upload(basename($file), $new_temp_filepath);

			return $asset->id;
		}
		catch (\Exception $e)
		{
			trace($e);
			// delete our temporary file if necessary:
			if (file_exists($new_temp_filepath))
			{
				$file_area->delete($new_temp_filepath);
			}

			throw($e);
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
			->where('user_role.name', '=', \RocketDuck\Perm_Role::SU)
			->limit(1)
			->execute();

		if ($admin_ids->count() > 0)
		{
			\Auth::instance('SimpleAuth')->force_login($admin_ids[0]['id']);
		}
		else
		{
			self::abort("Can't find an admin user");
		}
	}

	private static function get_manifest_data($dir)
	{
		$manifest_data = false;
		$manifest_file = $dir.'/install.yaml';
		if ( ! file_exists($manifest_file))
		{
			self::abort('Missing manifest yaml file', true);
		}

		$file_area = \File::forge(['basedir' => null]);
		$manifest_data = \Format::forge($file_area->read($manifest_file, true), 'yaml')->to_array();
		return $manifest_data;
	}

	private static function get_demo_text($dir)
	{
		$demo_text = false;
		$demo_file = $dir.'/demo.yaml';
		if (file_exists($demo_file))
		{
			$file_area = \File::forge(['basedir' => null]);
			$demo_text = $file_area->read($demo_file, true);
		}

		return $demo_text;
	}

	private static function validate_demo($demo_data)
	{
		if ( ! isset($demo_data['name']))
		{
			self::abort('Missing name in demo', true);
		}

		if ( ! isset($demo_data['qset']))
		{
			self::abort('Missing qset in demo', true);
		}

		if ( ! isset($demo_data['qset']['data']))
		{
			self::abort('Missing qset data in demo', true);
		}

		if ( ! isset($demo_data['qset']['version']))
		{
			self::abort('Missing qset version in demo', true);
		}
	}

	// checks to make sure the widget contains the required data.
	// throws with the reason if not.
	private static function validate_widget($dir)
	{
		// 1. Do we have a manifest yaml file?
		$manifest_data = self::get_manifest_data($dir);

		// 2. our manifest should have, at least, a general, files, score and metadata sections
		$missing_sections = array_diff(['general', 'files', 'score', 'meta_data'], array_keys($manifest_data));
		if (count($missing_sections) > 0)
		{
			self::abort('Manifest missing one or more required sections: '.implode(', ', $missing_sections), true);
		}

		// 3. make sure the general section is correct
		$general = $manifest_data['general'];
		self::abort_if_missing_required_attributes('general', $general, ['name', 'group', 'height', 'width', 'is_storage_enabled', 'in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'api_version']);
		self::abort_if_values_are_not_numeric($general, ['width', 'height']);
		self::abort_if_values_are_not_boolean($general, ['in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'is_storage_enabled']);
		// make sure the name matches. we ignore any "_12345678" type suffix, since this would have been added
		// by extracting the zip, assuming this widget was originally from a zip.
		basename(preg_replace('/_[0-9]+$/', '', $dir));


		// 4. make sure the files section is correct
		$files = $manifest_data['files'];
		self::abort_if_missing_required_attributes('files', $files, ['player']);
		self::abort_if_values_are_not_numeric($files, ['flash_version']);
		$player_file = $dir.'/'.$files['player'];
		if ( ! file_exists($player_file))
		{
			self::abort('The player file specified in the mainfest ('.$player_file.') could not be found', true);
		}
		if (isset($files['creator']))
		{
			$creator_file = $dir.'/'.$files['creator'];
			if ( ! file_exists($creator_file))
			{
				self::abort('The creator file specified in the mainfest ('.$creator_file.') could not be found', true);
			}
		}

		// 5. make sure score section is correct
		$score = $manifest_data['score'];
		self::abort_if_missing_required_attributes('score', $score, ['is_scorable', 'score_module']);
		self::abort_if_values_are_not_boolean($score, ['is_scorable']);

		// 6. make sure metadata section is correct
		$metadata = $manifest_data['meta_data'];
		self::abort_if_missing_required_attributes('meta_data', $metadata, ['about', 'excerpt']);
	}

	// checks to make sure score module and the score module test exist
	// if necessary
	private static function validate_score_modules($dir)
	{
		if ( ! file_exists($dir.'/_score-modules/score_module.php'))
		{
			self::abort('Missing score module file.');
		}
		if ( ! file_exists($dir.'/_score-modules/test_score_module.php'))
		{
			self::abort('Missing test score module file.');
		}
	}

	private static function abort_if_missing_required_attributes($section_name, $section, $required)
	{
		$missing_sections = array_diff($required, array_keys($section));
		if (count($missing_sections) > 0)
		{
			self::abort('Manifest '.$section_name.' section missing one or more required values: '.implode(', ', $missing_sections), true);
		}
	}

	private static function abort_if_values_are_not_numeric($section_data, $attributes)
	{
		$values = [];
		foreach ($attributes as $attribute)
		{
			if (isset($section_data[$attribute]))
			{
				$values[$attribute] = $section_data[$attribute];
			}
		}

		$wrong_values = array_filter($values, function($value) {
			return ! is_numeric($value);
		});

		if (count($wrong_values) > 0)
		{
			self::abort('The following attributes must be numeric: '.implode(', ', array_keys($wrong_values)), true);
		}
	}

	private static function abort_if_values_are_not_boolean($section_data, $attributes)
	{
		$values = [];
		foreach ($attributes as $attribute)
		{
			if (isset($section_data[$attribute]))
			{
				$values[$attribute] = $section_data[$attribute];
			}
		}

		$wrong_values = array_filter($values, function($value) {
			return gettype($value) !== 'boolean';
		});

		if (count($wrong_values) > 0)
		{
			self::abort('The following attributes must be boolean: '.implode(', ', array_keys($wrong_values)), true);
		}
	}

	private static function insert_metadata($id, $key, $value)
	{
		\DB::insert('widget_metadata')
			->set([
				'widget_id' => $id,
				'name' => $key,
				'value' => $value
			])
			->execute();
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
}
