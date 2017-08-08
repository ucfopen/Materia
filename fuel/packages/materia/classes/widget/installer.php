<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Materia;

use \RocketDuck\Util_Validator;

class Widget_Installer
{

	// This function will verify and extract the widget files without installing
	// This is primarily used to deposit expanded widgets into a production Docker Container
	public static function extract_package_files($widget_file, $widget_id)
	{
		try
		{
			list($dir, $manifest_data, $clean_name) = static::unzip_and_read_manifest($widget_file);
			static::install_widget_files($widget_id, $manifest_data, $dir);
			$success = true;
		}
		catch (\Exception $e)
		{
			trace($e);
			$success = false;
		}

		if (isset($dir)) static::cleanup($dir);
		return $success;
	}

	public static function extract_package_and_install($widget_file, $skip_upgrade = false, $replace_id = 0)
	{
		try
		{
			$activity = new Session_Activity([
				'user_id' => \Model_User::find_current_id()
			]);

			list($dir, $manifest_data, $clean_name) = static::unzip_and_read_manifest($widget_file);

			// Check for existing widgets
			$matching_widgets = static::find_by_clean_name($clean_name);
			$num_existing = count($matching_widgets);

			if ($skip_upgrade && $num_existing)
			{
				if (\Fuel::$is_cli)
				{
					\Cli::write("Multiple Existing widgets found with name $clean_name", 'red');
					foreach ($matching_widgets as $i => $matching_widget)
					{
						\Cli::write("==> ID:{$matching_widget['id']} ({$matching_widget['name']})", 'green');
					}
					\Cli::write('Run install again with "--replace-id=ID" option', 'yellow');
					return;
				}
				else
				{
					throw new \Exception("Existing widgets found for $clean_name, not upgrading due to --skip-upgrade option");
				}
			}

			if ($num_existing > 1 && $replace_id == 0)
			{
				throw new \Exception("Multiple existing widgets share this clean name: $clean_name");
			}

			if ($num_existing == 1 && empty($skip_upgrade) && $replace_id == 0)
			{
				$replace_id = $matching_widgets[0]['id'];
			}

			$params = static::generate_install_params($manifest_data, $widget_file);

			$demo_instance_id = null;

			// UPGRADE
			if ( ! empty($replace_id))
			{
				static::out('Upgrading existing widget');
				$widget = static::update_params($replace_id, $params, true);
				$id = $widget->id;

				// keep track of the previously used instance id used for the demo
				if ($widget && ! empty($widget->meta_data['demo']))
				{
					$demo_instance_id = $widget->meta_data['demo'];
					static::out("Existing demo found: $demo_instance_id", 'yellow');
				}
				$activity->type = Session_Activity::TYPE_UPDATE_WIDGET;
			}
			// NEW
			else
			{
				static::out('Installing brand new widget');
				list($id, $num) = \DB::insert('widget')
					->set($params)
					->execute();
				$activity->type = Session_Activity::TYPE_INSTALL_WIDGET;
			}

			// ADD the Demo
			$demo_id = static::install_demo($id, $dir, $demo_instance_id);
			$manifest_data['meta_data']['demo'] = $demo_id;

			static::save_metadata($id, $manifest_data['meta_data']);
			static::install_widget_files($id, $manifest_data, $dir);
			static::out("Widget installed: {$id}-{$clean_name}", 'green');
			$success = true;
			$activity->item_id = $id;
			$activity->value_1 = $clean_name;
			$activity->db_store();
		}
		catch (\Exception $e)
		{
			trace($e);
			$success = false;
		}

		if (isset($dir)) static::cleanup($dir);
		return $success;
	}

	public static function get_temp_dir()
	{
		$tempfile = tempnam(sys_get_temp_dir(), '');
		if (file_exists($tempfile)) unlink($tempfile);
		mkdir($tempfile);
		if (is_dir($tempfile))
		{
			// make sure outputdir has a trailing slash
			if (substr($tempfile, -1) != '/') $tempfile .= '/';
			return $tempfile;
		}
		return false;
	}

	protected static function unzip_to_tmp($file)
	{
		$extract_location = static::get_temp_dir();
		if ( ! $extract_location)
		{
			throw new \Exception('Unable to extract widget.');
			return false;
		}

		// assume it's a zip, attempt to extract
		try
		{
			static::out("Extracting $file to $extract_location");
			$zip = new \ZipArchive();
			$zip->open($file);
			$zip->extractTo($extract_location);
			$zip->close();
			return realpath($extract_location);
		}
		catch (\Exception $e)
		{
			trace($e, true);

			// clean up after ourselves by removing the extracted directory.
			$file_area = \File::forge(['basedir' => null]);
			$file_area->delete_dir($extract_location);
			throw $e;
		}
	}

	protected static function validate_demo($demo_data)
	{
		if ( ! isset($demo_data['name']))
		{
			throw new \Exception('Missing name in demo');
		}

		if ( ! isset($demo_data['qset']))
		{
			throw new \Exception('Missing qset in demo');
		}

		if ( ! isset($demo_data['qset']['data']))
		{
			throw new \Exception('Missing qset data in demo');
		}

		if ( ! isset($demo_data['qset']['version']))
		{
			throw new \Exception('Missing qset version in demo');
		}
	}

	protected static function get_manifest_data($dir)
	{
		$manifest_data = false;
		$manifest_file = $dir.'/install.yaml';
		if ( ! file_exists($manifest_file))
		{
			throw new \Exception('Missing manifest yaml file');
		}

		$file_area = \File::forge(['basedir' => null]);
		$manifest_data = \Format::forge($file_area->read($manifest_file, true), 'yaml')->to_array();
		return $manifest_data;
	}


	protected static function preprocess_json_and_upload_assets($base_dir, $json_text)
	{
		preg_match_all('/<%\s*MEDIA\s*=\s*(\'|")(.*)(\'|")\s*%>/', $json_text, $matches);

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
				$asset_ids[$file] = static::sideload_asset($actual_file_path);
				$files_uploaded[] = $file;
			}

			$asset_id = $asset_ids[$file];
			$json_text = str_replace($preprocess_tags[$i], $asset_id, $json_text);
		}

		return $json_text;
	}

	// "uploads" an asset from a widget package
	protected static function sideload_asset($file)
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

	protected static function save_metadata($id, $metadata)
	{
		// add in the metadata
		foreach ($metadata as $metadata_key => $metadata_value)
		{
			if (is_array($metadata_value))
			{
				foreach ($metadata_value as $metadata_child_item)
				{
					static::db_insert_metadata($id, $metadata_key, $metadata_child_item);
				}
			}
			else
			{
				static::db_insert_metadata($id, $metadata_key, $metadata_value);
			}
		}
	}

	protected static function db_insert_metadata($id, $key, $value)
	{
		\DB::insert('widget_metadata')
			->set([
				'widget_id' => $id,
				'name'      => $key,
				'value'     => $value
			])
			->execute();
	}

	protected static function update_params($widget_id, $params, $force = false)
	{
		$existing_widget = new \Materia\Widget();
		$existing_widget->get($widget_id);

		if ((int) $existing_widget->id !== (int) $widget_id)
		{
			throw new \Exception("No widget found to upgrade: $widget_id");
		}

		if ( ! $force && $existing_widget->package_hash == $params['package_hash'])
		{
			throw new \Exception('Updated packages appears to be the same.');
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
			throw new \Exception("Failure updating existing widget data : $widget_id");
		}

		// delete any existing metadata
		\DB::delete('widget_metadata')
			->where('widget_id', $widget_id)
			->execute();

		return $existing_widget;
	}

	protected static function install_demo($widget_id, $package_dir, $existing_inst_id = null)
	{
		// ADD the Demo
		$json_file = $package_dir.'/demo.json';
		if (file_exists($json_file))
		{
			$file_area = \File::forge(['basedir' => null]);
			$demo_text = $file_area->read($json_file, true);
			$demo_data = \Format::forge($demo_text, 'json')->to_array();

			static::validate_demo($demo_data);
			try
			{
				$demo_text = static::preprocess_json_and_upload_assets($package_dir, $demo_text);
			}
			catch (\Exception $e)
			{
				trace($e);
				throw new \Exception('Error processing json and embedded assets');
			}

			$demo_data = \Format::forge($demo_text, 'json')->to_array();

			$qset = (object) ['version' => $demo_data['qset']['version'], 'data' => $demo_data['qset']['data']];


			if ($existing_inst_id)
			{
				$saved_demo = \Materia\API::widget_instance_update($existing_inst_id, $demo_data['name'], $qset, false, null, null, null, true);

				if ( ! isset($saved_demo->id))
				{
					trace($saved_demo);
					throw new \Exception('Error saving demo instance');
				}
			}
			else
			{
				$saved_demo = \Materia\API::widget_instance_new($widget_id, $demo_data['name'], $qset, false);

				if ( ! isset($saved_demo->id))
				{
					trace($saved_demo);
					throw new \Exception('Error saving demo instance');
				}
				// update it to make sure it allows guest access
				\Materia\API::widget_instance_update($saved_demo->id, null, null, null, null, null, null, true);
				// make sure nobody owns the demo widget
				\Materia\Perm_Manager::clear_user_object_perms($saved_demo->id, \Materia\Perm::INSTANCE, \Model_user::find_current_id());
			}

			static::out("Demo Installed: $saved_demo->id", 'green');
			return $saved_demo->id;
		}
	}

	protected static function find_by_clean_name($clean_name)
	{
		$engine = \DB::select()
			->from('widget')
			->where('clean_name', $clean_name)
			->execute()
			->as_array();

		return $engine;
	}

	protected static function validate_keys_exist($section, $required)
	{
		$missing_sections = array_diff($required, array_keys($section));
		if (count($missing_sections))
		{
			throw new \Exception('Missing required attributes: '.implode(',', $missing_sections));
		}
	}

	protected static function validate_numeric_values($section_data, $attributes)
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

		if (count($wrong_values))
		{
			throw new \Exception('Attributes expected to be numeric: '.implode(',', $wrong_values));
		}
	}

	protected static function validate_boolean_values($section_data, $attributes)
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

		if (count($wrong_values))
		{
			throw new \Exception('Attributes expected to be boolean: '.implode(',', $wrong_values));
		}
	}


	// checks to make sure the widget contains the required data.
	// throws with the reason if not.
	protected static function validate_widget($dir)
	{
		// 1. Do we have a manifest yaml file?
		$manifest_data = static::get_manifest_data($dir);

		// 2. our manifest should have, at least, a general, files, score and metadata sections
		$missing_sections = array_diff(['general', 'files', 'score', 'meta_data'], array_keys($manifest_data));
		if (count($missing_sections) > 0)
		{
			throw new \Exception('Manifest missing one or more required sections: '.implode(', ', $missing_sections));
		}

		// 3. make sure the general section is correct
		$general = $manifest_data['general'];
		static::validate_keys_exist($general, ['name', 'group', 'height', 'width', 'is_storage_enabled', 'in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'api_version']);

		static::validate_numeric_values($general, ['width', 'height']);
		static::validate_boolean_values($general, ['in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'is_storage_enabled']);
		// make sure the name matches. we ignore any "_12345678" type suffix, since this would have been added
		// by extracting the zip, assuming this widget was originally from a zip.
		basename(preg_replace('/_[0-9]+$/', '', $dir));


		// 4. make sure the files section is correct
		$files = $manifest_data['files'];
		static::validate_keys_exist($files, ['player']);
		static::validate_numeric_values($files, ['flash_version']);

		$player_file = $dir.'/'.$files['player'];
		if ( ! file_exists($player_file))
		{
			throw new \Exception("Player file missing: $player_file");
		}

		if (isset($files['creator']))
		{
			$creator_file = $dir.'/'.$files['creator'];
			if ( ! file_exists($creator_file))
			{
				throw new \Exception("Creator file missing: $creator_file");
			}
		}

		// 5. make sure score section is correct
		$score = $manifest_data['score'];
		static::validate_keys_exist($score, ['is_scorable', 'score_module']);
		static::validate_boolean_values($score, ['is_scorable']);

		// 7. make sure metadata section is correct
		$metadata = $manifest_data['meta_data'];
		static::validate_keys_exist($metadata, ['about', 'excerpt']);

		// 8. make sure score module and the score module test exist
		if ( ! file_exists("$dir/_score-modules/score_module.php"))
		{
			throw new \Exception('Missing score module file');
		}
		if ( ! file_exists("$dir/_score-modules/test_score_module.php"))
		{
			throw new \Exception('Missing score module tests');
		}
	}

	public static function generate_install_params($manifest_data, $package_file)
	{
		$clean_name = static::clean_name_from_manifest($manifest_data);
		$package_hash = md5_file($package_file);
		$params = [
			'name'                => $manifest_data['general']['name'],
			'created_at'          => time(),
			'group'               => $manifest_data['general']['group'],
			'flash_version'       => $manifest_data['files']['flash_version'],
			'height'              => $manifest_data['general']['height'],
			'width'               => $manifest_data['general']['width'],
			'is_qset_encrypted'   => Util_Validator::cast_to_bool_enum($manifest_data['general']['is_qset_encrypted']),
			'is_answer_encrypted' => Util_Validator::cast_to_bool_enum($manifest_data['general']['is_answer_encrypted']),
			'is_storage_enabled'  => Util_Validator::cast_to_bool_enum($manifest_data['general']['is_storage_enabled']),
			'is_playable'         => Util_Validator::cast_to_bool_enum($manifest_data['general']['is_playable']),
			'is_editable'         => Util_Validator::cast_to_bool_enum($manifest_data['general']['is_editable']),
			'is_scorable'         => Util_Validator::cast_to_bool_enum($manifest_data['score']['is_scorable']),
			'in_catalog'          => Util_Validator::cast_to_bool_enum($manifest_data['general']['in_catalog']),
			'clean_name'          => $clean_name,
			'api_version'         => (string)(int)$manifest_data['general']['api_version'],
			'package_hash'        => $package_hash,
			'score_module'        => $manifest_data['score']['score_module'],
			'creator'             => isset($manifest_data['files']['creator']) ? $manifest_data['files']['creator'] : '',
			'player'              => isset($manifest_data['files']['player']) ? $manifest_data['files']['player'] : '' ,
		];

		return $params;
	}

	protected static function cleanup($dir)
	{
		$file_area = \File::forge(['basedir' => null]);
		$file_area->delete_dir($dir);
	}

	protected static function install_widget_files($id, $manifest_data, $dir)
	{
		$file_area = \File::forge(['basedir' => null]);
		$clean_name = static::clean_name_from_manifest($manifest_data);
		$widget_dir = "{$id}-{$clean_name}";
		$score_module_clean_name = strtolower(\Inflector::friendly_title($manifest_data['score']['score_module'])).'.php';

		// create the widget specific directory
		static::clear_path(PKGPATH.'materia/vendor/widget/'.$widget_dir);
		$file_area->create_dir(PKGPATH.'materia/vendor/widget/', $widget_dir);

		// playdata exporters
		// needs proper packaging of export module by devmateria
		// add  {expand: true, cwd: "#{widget}/_exports", src: ['**'], dest: ".compiled/#{widget}/_exports"}
		// to gruntfile after line 104
		$pkg_playdata_file = "{$dir}/_exports/playdata_exporters.php";
		if (file_exists($pkg_playdata_file))
		{
			$destination_playdata_file = PKGPATH.'materia/vendor/widget/'.$widget_dir.'/playdata_exporters.php';
			static::clear_path($destination_playdata_file);
			$file_area->rename($pkg_playdata_file, $destination_playdata_file);
			// delete the export modules folder so it won't get copied over
			$file_area->delete_dir($dir.'/_exports');

			// add export methods to metadata
			if (file_exists($destination_playdata_file))
			{
				$methods = \Materia\Utils::load_methods_from_file($destination_playdata_file);
				if ( ! empty($methods))
				{
					$metadata = ['playdata_exporters' => array_keys($methods)];
					static::save_metadata($id, $metadata);
				}
			}
		}

		// move tests
		$new_test = PKGPATH.'materia/vendor/widget/test/'.$score_module_clean_name;
		static::clear_path($new_test);
		$file_area->rename($dir.'/_score-modules/test_score_module.php', $new_test);

		// move spec to the main materia spec folder, if it exists
		$pkg_spec = $dir.'/spec/spec.coffee';
		if (file_exists($pkg_spec))
		{
			$new_spec = APPPATH."../../spec/widgets/{$clean_name}.spec.coffee";
			static::clear_path($new_spec);
			$file_area->rename($pkg_spec, $new_spec);
		}

		// move widget files
		// public_widget_dir
		$new_dir = \Config::get('materia.dirs.engines').$widget_dir;
		if (is_dir($new_dir)) $file_area->delete_dir($new_dir);
		$file_area->copy_dir($dir, $new_dir);

		static::out("Widget files deployed: {$id}-{$clean_name}", 'green');
	}

	protected static function clear_path($file)
	{
		$file_area = \File::forge(['basedir' => null]);
		if (is_dir($file)) $file_area->delete_dir($file);
		if (file_exists($file)) $file_area->delete($file);
	}

	protected static function clean_name_from_manifest($manifest_data)
	{
		return \Inflector::friendly_title($manifest_data['general']['name'], '-', true);
	}

	protected static function unzip_and_read_manifest($widget_file)
	{
			$dir = static::unzip_to_tmp($widget_file);
			static::validate_widget($dir);
			$manifest_data = static::get_manifest_data($dir);
			$clean_name = static::clean_name_from_manifest($manifest_data);

			return [$dir, $manifest_data, $clean_name];
	}

	private static function out($msg, $color = null)
	{
		if (\Fuel::$is_cli) \Cli::write($msg, $color);
		else trace($msg);
	}
}
