<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Materia;

use \Materia\Util_Validator;

class Widget_Installer
{
	/**
	 * Extracts a .wigt file to it's proper target destination without using a database connection
	 * Usefull for Heroku build process, pre-packaging servers, or similar activities.
	 * @param  string $widget_file Path to .wigt file
	 * @param  int    $widget_id   ID to use for the widget's id (when using the normal db install, this comes from the db)
	 * @return bool              Success
	 */
	public static function extract_package_files(string $widget_file, int $widget_id): bool
	{
		try
		{
			[$dir, $manifest_data, $clean_name] = static::unzip_and_read_manifest($widget_file);
			static::install_widget_files($widget_id, $clean_name, $dir);
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

	// @codingStandardsIgnoreStart
	// code sniffer needs major breaking updates to handle ?int and ?bool
	public static function extract_package_and_install(string $widget_file, ?bool $skip_upgrade = false, ?int $replace_id = 0): bool
	{
	// @codingStandardsIgnoreEnd
		try
		{
			$activity = new Session_Activity([
				'user_id' => \Model_User::find_current_id()
			]);

			[$dir, $manifest_data, $clean_name] = static::unzip_and_read_manifest($widget_file);

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
					return false;
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

			$existing_demo_inst_id = null;

			// NEW
			if (empty($replace_id))
			{
				static::out('Installing brand new widget');
				$id = static::save_params($params);
				$activity->type = Session_Activity::TYPE_INSTALL_WIDGET;
			}
			// UPGRADE
			else
			{
				$existing_widget = \Materia\Widget::forge($replace_id);
				static::out('Upgrading existing widget');
				$id = static::save_params($params, $replace_id);

				// keep track of the previously used instance id used for the demo
				if ($existing_widget && ! empty($existing_widget->meta_data['demo']))
				{
					$existing_demo_inst_id = $existing_widget->meta_data['demo'];
					static::out("Existing demo found: $existing_demo_inst_id", 'yellow');
				}
				$activity->type = Session_Activity::TYPE_UPDATE_WIDGET;
			}

			// ADD the Demo
			$demo_id = static::install_demo($id, $dir, $existing_demo_inst_id);
			$manifest_data['meta_data']['demo'] = $demo_id;

			static::install_widget_files($id, $clean_name, $dir);

			// save metadata into the db
			static::save_metadata($id, $manifest_data['meta_data']);

			static::out("Widget installed: {$dir}", 'green');
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

	public static function get_temp_dir(): ?string
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
		return null;
	}

	protected static function unzip_to_tmp(string $file): ?string
	{
		$extract_location = static::get_temp_dir();
		if ( ! $extract_location)
		{
			throw new \Exception('Unable to extract widget.');
			return null;
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

	protected static function validate_demo(array $demo_data): void
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

	protected static function get_manifest_data(string $dir): array
	{
		$manifest_data = false;
		$manifest_file = $dir.DS.'install.yaml';
		if ( ! file_exists($manifest_file))
		{
			throw new \Exception('Missing manifest yaml file');
		}

		$file_area = \File::forge(['basedir' => null]);
		$manifest_data = \Format::forge($file_area->read($manifest_file, true), 'yaml')->to_array();
		return $manifest_data;
	}


	protected static function preprocess_json_and_upload_assets(string $base_dir, string $json_text): string
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
	protected static function sideload_asset(string $file): string
	{
		try
		{
			// copy asset to where files would normally be uploaded to
			$src_area = \File::forge(['basedir' => sys_get_temp_dir()]); // restrict copying from system tmp dir
			$mock_upload_file_path = \Config::get('file.dirs.media_uploads').uniqid('sideload_');
			\File::copy($file, $mock_upload_file_path, $src_area, 'media');

			// process the upload
			$upload_info = \File::file_info($mock_upload_file_path, 'media');
			$asset = \Materia\Widget_Asset_Manager::new_asset_from_file('Demo asset '.basename($file), $upload_info);


			static::out('Asset '.basename($file)." sideloaded to asset {$asset->id}");
			return $asset->id;
		}
		catch (\Exception $e)
		{
			trace($e);
			throw($e);
		}
	}

	public static function save_metadata(int $id, array $metadata): void
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

	public static function db_insert_metadata(int $id, string $key, string $value): void
	{
		\DB::insert('widget_metadata')
			->set([
				'widget_id' => $id,
				'name'      => $key,
				'value'     => $value
			])
			->execute();
	}

	protected static function save_params(array $params, ?int $widget_id = null): int
	{
		// check for existing
		$result = \DB::select()
			->from('widget')
			->where('id', $widget_id)
			->execute();

		if ($result->count() == 0)
		{
			// new
			if ( ! empty($widget_id)) $params['id'] = $widget_id; // allows us to insert new items and set id
			[$widget_id, $num] = \Db::insert('widget')
				->set($params)
				->execute();
		}
		else
		{
			// update
			// Do not over-write the db's in_catalog flag
			if (isset($params['in_catalog'])) unset($params['in_catalog']);

			$num = \DB::update('widget')
				->set($params)
				->where('id', $widget_id)
				->limit(1)
				->execute();
		}

		if ($num != 1)
		{
			throw new \Exception("Failure updating existing widget data : $widget_id");
		}

		// delete any existing metadata
		\DB::delete('widget_metadata')
			->where('widget_id', $widget_id)
			->execute();

		return $widget_id;
	}


	protected static function install_demo(int $widget_id, string $package_dir, ?string $existing_inst_id = null): string
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
				// Update the existing instance by adding a new qset
				$saved_demo = \Materia\API::widget_instance_update($existing_inst_id, $demo_data['name'], $qset, false, null, null, null, true);

				if ( ! isset($saved_demo->id))
				{
					trace($saved_demo);
					throw new \Exception('Error saving demo instance');
				}
			}
			else
			{
				// New instance, nothing to upgrade
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

	protected static function find_by_clean_name(string $clean_name): array
	{
		$engine = \DB::select()
			->from('widget')
			->where('clean_name', $clean_name)
			->execute()
			->as_array();

		return $engine;
	}

	protected static function validate_keys_exist(array $section, array $required): void
	{
		$missing_sections = array_diff($required, array_keys($section));
		if (count($missing_sections))
		{
			throw new \Exception('Missing required attributes: '.implode(',', $missing_sections));
		}
	}

	protected static function validate_numeric_values(array $section_data, array $attributes): void
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

	protected static function validate_boolean_values(array $section_data, array $attributes): void
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
	protected static function validate_widget(string $dir): void
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
		static::validate_keys_exist($general, ['name', 'height', 'width', 'is_storage_enabled', 'in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'api_version']);

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

		if (empty($files['creator']))
		{
			throw new \Exception('Creator does not exist');
		}
		else
		{
			if ($files['creator'] !== 'default')
			{
				$creator_file = $dir.'/'.$files['creator'];
				if ( ! file_exists($creator_file))
				{
					throw new \Exception("Creator file missing: $creator_file");
				}
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

	public static function generate_install_params(array $manifest_data, string $package_file): array
	{
		$clean_name = \Materia\Widget::make_clean_name($manifest_data['general']['name']);
		$package_hash = md5_file($package_file);
		$params = [
			'name'                => $manifest_data['general']['name'],
			'created_at'          => time(),
			'flash_version'       => $manifest_data['files']['flash_version'],
			'height'              => $manifest_data['general']['height'],
			'width'               => $manifest_data['general']['width'],
			'restrict_publish'    => isset($manifest_data['general']['restrict_publish']) ? Util_Validator::cast_to_bool_enum($manifest_data['general']['restrict_publish']) : '0',
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
			'score_screen'        => isset($manifest_data['score']['score_screen']) ? $manifest_data['score']['score_screen'] : '',
			'creator_guide'       => isset($manifest_data['files']['creator_guide']) ? $manifest_data['files']['creator_guide'] : '',
			'player_guide'        => isset($manifest_data['files']['player_guide']) ? $manifest_data['files']['player_guide'] : ''
		];
		return $params;
	}

	protected static function cleanup(string $dir): void
	{
		$file_area = \File::forge(['basedir' => null]);
		$file_area->delete_dir($dir);
	}

	/**
	 * Moves widget files from temp location to final location w/o touching db
	 * @param  int    $id          Widget id
	 * @param  string $clean_name  Widget clean_name
	 * @param  string $source_path Full path to the directory currently containing widget files
	 * @return void
	 */
	protected static function install_widget_files(int $id, string $clean_name, string $source_path): void
	{
		$widget_dir = \Materia\Widget::make_dir($id, $clean_name);
		$target_dir = \Config::get('file.dirs.widgets').$widget_dir;
		$file_area = \File::forge(['basedir' => null]);
		if (is_dir($target_dir)) $file_area->delete_dir($target_dir);
		$file_area->copy_dir($source_path, $target_dir);

		static::out("Widget files deployed: {$widget_dir}", 'green');
	}

	protected static function clear_path(string $file): void
	{
		$file_area = \File::forge(['basedir' => null]);
		if (is_dir($file)) $file_area->delete_dir($file);
		if (file_exists($file)) $file_area->delete($file);
	}

	/**
	 * Unzip a .wigt file into a temp directory, validate it, and extract manifest data
	 * @param  string $widget_file Path to .wigt file
	 * @return array
	 */
	protected static function unzip_and_read_manifest(string $widget_file): array
	{
			$target_dir = static::unzip_to_tmp($widget_file);
			static::validate_widget($target_dir);
			$manifest_data = static::get_manifest_data($target_dir);
			$clean_name = \Materia\Widget::make_clean_name($manifest_data['general']['name']);

			// load the playdata script to add it's method names to the metadata
			$playdata_path = $target_dir.DS.\Materia\Widget::PATHS_PLAYDATA;
			$loaded = \Materia\Widget::load_script($playdata_path);
			$playdata_exporter_names = array_keys(\Materia\Widget::reduce_array_to_functions($loaded));
			$manifest_data['meta_data']['playdata_exporters'] = $playdata_exporter_names;

			return [$target_dir, $manifest_data, $clean_name];
	}

	protected static function out(string $msg, ?string $color = null): void
	{
		if (\Fuel::$is_cli) \Cli::write($msg, $color);
		else trace($msg);
	}
}
