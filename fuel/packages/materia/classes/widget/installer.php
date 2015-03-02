<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Materia;

class Widget_Installer
{
	private static function get_temp_dir()
	{
		$tempfile = tempnam(sys_get_temp_dir(), '');
		if (file_exists($tempfile)) unlink($tempfile);
		mkdir($tempfile);
		if (is_dir($tempfile)) return $tempfile;
		return false;
	}

	public static function extract_widget($widget_file)
	{
		$extract_location = self::get_temp_dir();
		if ( ! $extract_location)
		{
			self::end('Unable to extract widget.', true);
			return false;
		}

		// assume it's a zip, attempt to extract
		try
		{
			$zip = new \ZipArchive();
			$zip->open($widget_file);
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
		}

		return false;
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

	public static function get_manifest_data($dir)
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

	public static function install_db($params)
	{
		return \DB::insert('widget')
			->set($params)
			->execute();
	}

	public static function add_manifest($id, $manifest_data)
	{
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
	}

	private static function insert_metadata($id, $key, $value)
	{
		\DB::insert('widget_metadata')
			->set([
				'widget_id' => $id,
				'name'      => $key,
				'value'     => $value
			])
			->execute();
	}

	public static function upgrade_widget($widget_id, $params, $package_hash, $force = false)
	{
		$existing_widget = new \Materia\Widget();
		$existing_widget->get($widget_id);

		if ($existing_widget->id !== $widget_id)
		{
			return -1;
		}

		if ( ! $force && $existing_widget->package_hash == $package_hash)
		{
			return -2;
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
			return -3;
		}

		// delete any existing metadata
		\DB::delete('widget_metadata')
			->where('widget_id', $widget_id)
			->execute();

		return $existing_widget;
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

	// @TODO: DUPLICATE EXISTS IN WIDGET TASK
	public static function install_demo($widget_id, $package_dir, $existing_inst_id = null)
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
				return -1;
			}
			$demo_data = \Format::forge($demo_text, 'yaml')->to_array();

			$qset = (object) ['version' => $demo_data['qset']['version'], 'data' => $demo_data['qset']['data']];

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
				return -2;
			}
			else
			{
				return $saved_demo->id;
			}
		}
	}

	public static function get_existing($clean_name)
	{
		$engine = \DB::select()
			->from('widget')
			->where('clean_name', $clean_name)
			->execute()
			->as_array();

		return $engine;
	}

	private static function missing_required_attributes($section, $required)
	{
		$missing_sections = array_diff($required, array_keys($section));
		return (count($missing_sections) > 0);
		//	self::abort('Manifest '.$section_name.' section missing one or more required values: '.implode(', ', $missing_sections), true);
	}

	private static function values_are_not_numeric($section_data, $attributes)
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

		return (count($wrong_values) > 0);
		//	self::abort('The following attributes must be numeric: '.implode(', ', array_keys($wrong_values)), true);
	}

	private static function values_are_not_boolean($section_data, $attributes)
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

		return (count($wrong_values) > 0);
		//	self::abort('The following attributes must be boolean: '.implode(', ', array_keys($wrong_values)), true);
	}


	// checks to make sure the widget contains the required data.
	// throws with the reason if not.
	public static function validate_widget($dir)
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
		if (self::missing_required_attributes($general, ['name', 'group', 'height', 'width', 'is_storage_enabled', 'in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'api_version'])) return;

		if (self::values_are_not_numeric($general, ['width', 'height'])) return;
		if (self::values_are_not_boolean($general, ['in_catalog', 'is_editable', 'is_playable', 'is_qset_encrypted', 'is_answer_encrypted', 'is_storage_enabled'])) return;
		// make sure the name matches. we ignore any "_12345678" type suffix, since this would have been added
		// by extracting the zip, assuming this widget was originally from a zip.
		basename(preg_replace('/_[0-9]+$/', '', $dir));


		// 4. make sure the files section is correct
		$files = $manifest_data['files'];
		if (self::missing_required_attributes($files, ['player'])) return;
		if (self::values_are_not_numeric($files, ['flash_version'])) return;

		$player_file = $dir.'/'.$files['player'];
		if ( ! file_exists($player_file))
		{
			//self::abort('The player file specified in the mainfest ('.$player_file.') could not be found', true);
			return;
		}

		if (isset($files['creator']))
		{
			$creator_file = $dir.'/'.$files['creator'];
			if ( ! file_exists($creator_file))
			{
				//self::abort('The creator file specified in the mainfest ('.$creator_file.') could not be found', true);
				return;
			}
		}

		// 5. make sure score section is correct
		$score = $manifest_data['score'];
		if (self::missing_required_attributes($score, ['is_scorable', 'score_module'])) return;
		if (self::values_are_not_boolean($score, ['is_scorable'])) return;

		// 6. make sure metadata section is correct
		$metadata = $manifest_data['meta_data'];
		if (self::missing_required_attributes($metadata, ['about', 'excerpt'])) return;
	}

	public static function generate_install_params($manifest_data, $package_hash)
	{
		$clean_name = \Inflector::friendly_title($manifest_data['general']['name'], '-', true);
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
			'is_scorable'         => (string)(int)$manifest_data['score']['is_scorable'],
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

		return $params;
	}

	// checks to make sure score module and the score module test exist
	// if necessary
	public static function validate_score_modules($dir)
	{
		if ( ! file_exists($dir.'/_score-modules/score_module.php'))
		{
			return -2;
		}
		if ( ! file_exists($dir.'/_score-modules/test_score_module.php'))
		{
			return -1;
		}
		return 1;
	}

	public static function cleanup($dir)
	{
		$file_area = \File::forge(['basedir' => null]);
		$file_area->delete_dir($dir);
	}

	public static function install_widget_files($id, $manifest_data, $dir)
	{
		$file_area = \File::forge(['basedir' => null]);
		$clean_name = \Inflector::friendly_title($manifest_data['general']['name'], '-', true);
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
		if (file_exists($widgetspec))
		{
			$new_spec = APPPATH."../../spec/widgets/{$clean_name}.spec.coffee";
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
	}

	public static function force_install($widget_file)
	{
		try
		{
			$file_area = \File::forge(['basedir' => null]);
			$dir = self::extract_widget($widget_file);
			if (!$dir)
			{
				return false;
			}

			$valid = self::validate_widget($dir);
			$manifest_data = self::get_manifest_data($dir);
			$records_scores = $manifest_data['score']['is_scorable'];

			// score module and test score module are now mandatory, even if they're not functional.
			$scores_valid = self::validate_score_modules($dir);
			if ($scores_valid < 0)
			{
				return false;
			}

			$clean_name = \Inflector::friendly_title($manifest_data['general']['name'], '-', true);
			$matching_widgets = self::get_existing($clean_name);

			$package_hash = md5_file($widget_file);

			$num_matching_widgets = count($matching_widgets);

			$params = self::generate_install_params($manifest_data, $package_hash);

			if ($num_matching_widgets >= 1)
			{
				$upgrade_id = $matching_widgets[0]['id'];
				$existing_widget = self::upgrade_widget($upgrade_id, $params, $package_hash, true);

				if (is_int($existing_widget) && $existing_widget < 0)
				{
					return false;
				}

				$id = $upgrade_id;
			}
			else
			{
				list($id, $num) = self::install_db($params);
			}

			$demo_instance_id = null;

			// ADD the Demo
			if ($demo_id = self::install_demo($id, $dir, $demo_instance_id))
			{
				$manifest_data['meta_data']['demo'] = $demo_id;
			}
			else if ($demo_id < 0)
			{
				return false;
			}

			self::add_manifest($id, $manifest_data);
			self::install_widget_files($id, $manifest_data, $dir);
			self::cleanup($dir);

			return true;
		}
		catch (\Exception $e)
		{
			trace($e);
			self::cleanup($dir);
		}

		return false;
	}

}
