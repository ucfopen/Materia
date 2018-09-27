<?php
/**
 * The go between for the user and the Materia Package.
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      Kevin Baugh
 */

namespace Materia;

class Widget
{
	public $clean_name          = '';
	public $creator             = '';
	public $created_at          = 0;
	public $dir                 = '';
	public $flash_version       = 0;
	public $api_version         = 0;
	public $group               = '';
	public $height              = 0;
	public $id                  = 0;
	public $is_answer_encrypted = true;
	public $in_catalog          = true;
	public $is_editable         = true;
	public $is_playable         = true;
	public $is_qset_encrypted   = true;
	public $is_scalable         = 0;
	public $is_scorable         = true;
	public $is_storage_enabled  = false;
	public $package_hash        = '';
	public $meta_data           = null;
	public $name                = '';
	public $player              = '';
	public $question_types      = '';
	public $score_module        = 'base';
	public $score_screen        = '';
	public $width               = 0;

	public const PATHS_PLAYDATA = '_exports'.DS.'playdata_exporters.php';
	public const PATHS_SCOREMOD = '_score-modules'.DS.'score_module.php';

	protected $exporter_methods = [];

	public function __construct($properties=[])
	{
		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
			// if a clean name wasn't created already, make one based on the name
			if ( ! empty($properties['name']) && empty($this->clean_name)) $this->clean_name = self::make_clean_name($this->name);
			$this->dir = static::make_dir($this->id, $this->clean_name);
			if ($this->api_version == 0) $this->api_version = \Config::get('materia.default_api_version');
		}
	}

	public static function make_dir($id, $clean_name)
	{
		return "{$id}-{$clean_name}".DS;
	}

	public static function forge($id_or_clean_name)
	{
		$widget = new Widget();
		$widget->get($id_or_clean_name);
		return $widget;
	}

	/**
	 *  Load a widget definition from the database based on name or widget_id
	 * @param mixed widget_id or clean name
	 */
	public function get($id_or_clean_name)
	{
		// ------------------------- GET THE WIDGET -------------------
		$q = \DB::select()->from('widget');

		if (\Materia\Util_Validator::is_pos_int($id_or_clean_name))
		{
			$q->where('id', $id_or_clean_name); // search by id
		}
		else
		{
			$q->where('clean_name', $id_or_clean_name); // search by clean name
		}
		$results = $q->execute();

		if ($results->count() != 1) return false;

		$w = $results[0];

		// -------------- INIT OBJECT ---------------
		$this->__construct([
			'clean_name'          => $w['clean_name'],
			'created_at'          => $w['created_at'],
			'creator'             => $w['creator'],
			'is_answer_encrypted' => $w['is_answer_encrypted'],
			'is_qset_encrypted'   => $w['is_qset_encrypted'],
			'flash_version'       => $w['flash_version'],
			'api_version'         => $w['api_version'],
			'group'               => $w['group'],
			'height'              => $w['height'],
			'id'                  => $w['id'],
			'in_catalog'          => $w['in_catalog'],
			'is_editable'         => $w['is_editable'],
			'name'                => $w['name'],
			'is_playable'         => $w['is_playable'],
			'player'              => $w['player'],
			'is_scorable'         => $w['is_scorable'],
			'is_scalable'         => $w['is_scalable'],
			'score_module'        => $w['score_module'],
			'score_screen'        => $w['score_screen'],
			'is_storage_enabled'  => $w['is_storage_enabled'],
			'package_hash'        => $w['package_hash'],
			'width'               => $w['width'],
			'meta_data'           => static::db_get_metadata($w['id']),
		]);

		return true;
	}

	private static function db_get_metadata($id)
	{
		$meta_data = ['features' => [], 'supported_data' => []];

		$meta_results = \DB::select('name', 'value')
			->from('widget_metadata')
			->where('widget_id', (string) $id)
			->execute();

		foreach ($meta_results as $meta)
		{
			$name  = $meta['name'];
			$value = $meta['value'];

			switch ($name)
			{
				# multiple items with these keys will be placed in an array
				case 'features':
				case 'supported_data':
				case 'playdata_exporters':
					if ( ! isset($meta_data[$name])) $meta_data[$name] = []; // initialize if needed
					$meta_data[$name][] = $value;
					break;

				default:
					$meta_data[$name] = $value;
					break;
			}
		}

		return $meta_data;
	}

	public function get_property($prop)
	{
		$val = '';
		if (property_exists($this, $prop))
		{
			$val = \DB::select($prop)
				->from('widget')
				->where('id', $this->id)
				->execute()[0][$prop];
		}
		else
		{
			$val = \DB::select('value')
				->from('widget_metadata')
				->where('widget_id', $this->id)
				->where('name', $prop)
				->execute()[0]['value'];
		}
		return $val;
	}

	public function set_property($prop, $val)
	{
		if ( ! \Materia\Perm_Manager::is_super_user() ) throw new HttpNotFoundException;

		$original = $this->get_property($prop, $val);
		if ($original == $val) return true;
		try
		{
			if (property_exists($this, $prop))
			{
				\DB::update('widget')
					->set([$prop  => $val])
					->where('id', $this->id)
					->execute();
			}
			else
			{
				\DB::update('widget_metadata')
					->set(['value' => $val])
					->where('widget_id', $this->id)
					->where('name', $prop)
					->execute();
			}

			$activity = new Session_Activity([
				'user_id' => \Model_User::find_current_id(),
				'type'    => Session_Activity::TYPE_ADMIN_EDIT_WIDGET,
				'item_id' => $this->id,
				'value_1' => $prop,
				'value_2' => $original,
				'value_3' => $val,
			]);
			$activity->db_store();
		}
		catch (Exception $e)
		{
			return false;
		}
		return true;
	}

	public function get_score_module_class()
	{
		$score_module_class_name = "\Materia\Score_Modules_{$this->score_module}";

		// attempt to load the class if we don't have it
		if ( ! class_exists($score_module_class_name))
		{
			$script_path = self::make_relative_widget_path(static::PATHS_SCOREMOD);
			static::load_script($script_path);
			if ( ! class_exists($score_module_class_name))
			{
				throw new \Exception("Score module missing: {$score_module_class_name}");
			}
		}

		return $score_module_class_name;
	}


	// To execute a method, use execute_custom_method()
	public function get_playdata_exporter_methods(?string $script_path = null)
	{
		// short circuit with cached methods
		if ( ! empty($this->exporter_methods)) return $this->exporter_methods;

		if ( ! $script_path)
		{
			$script_path = self::make_relative_widget_path(static::PATHS_PLAYDATA);
		}

		// load the widget script
		$loaded = static::load_script($script_path);

		// filter out callables and cache them for later
		$this->exporter_methods = static::make_callable_array($loaded);
		return $this->exporter_methods;
	}

	public static function make_callable_array(array $array): array
	{
		$methods = [];
		// copy only callable methods to output and clean up their method names
		foreach ($methods as $name => &$method)
		{
			if (is_callable($method))
			{
				$name = self::make_clean_name($name);
				$methods[$name] = $method;
			}
		}

		return $methods;
	}

	public static function make_clean_name($unclean_name)
	{
		return \Inflector::friendly_title($unclean_name, '_', true);
	}

	protected function make_relative_widget_path($widget_script)
	{
		$file = \Config::get('file.dirs.widgets')."{$this->dir}{$widget_script}";

		// in test, build a path w/o the widget id
		if (\FUEL::$env === \FUEL::TEST)
		{
			$file = \Config::get('file.dirs.widgets').$this->clean_name.DS.$widget_script;
		}

		return $file;
	}

	public static function load_script(string $script_path)
	{
		// closure helps to prevent the script poluting this and isolate scope
		// in within the included script
		$load_safer = function($file)
		{
			if ( ! file_exists($file))
			{
				trace("Script not found: {$file}");
				return [];
			}

			return include($file);
		};

		return $load_safer($script_path);
	}

}
