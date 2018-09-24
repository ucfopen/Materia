<?php

// Enable this class in config.always_load.classes if needed
class Alwaysload
{

	// called when loaded
	// a good place to do initialization
	public static function _init()
	{
		\Config::load('materia', true); // Always load is loaded before configs listed in config.always_load.configs
		self::build_asset_cache_buster_hashes();
	}

	/**
	* materia is dynamically building the asset urls based on web requests
	* this means their full paths can only be determined in context of a server request
	* This function makes sure hashes built by the materia-server-client-assets node module
	* can be used to cache bust the dynamically created paths on the server
	* npm makes "js/myfile.js": "xxxxxxx"
	* this appends "https://materia.static.com/js/myfile.js": "xxxxxxxx"
	* so when the server places the https://materia.static.com/js/myfile.js asset in the page
	* it will have the hash appended
	* it's important that the hash comes from a config file (so we cant md5 on the fly)
	* and it's important that those routes be dynamic, to reduce configuration complexity
	**/
	protected static function build_asset_cache_buster_hashes()
	{
		$hashes = \Config::load('asset_hash.json', true);

		// nothing loaded?
		if ( ! is_array($hashes)) return;

		// already calculated?
		if ( ! empty($hashes['static']) && $hashes['static'] == \Config::get('materia.urls.static')) return;

		// add in css
		$css = \Config::load('css', true);
		if (is_array($css)) $hashes = self::add_resolved_hash_paths($hashes, $css);

		// add in js
		$js = \Config::load('js', true);
		if (is_array($js)) $hashes = self::add_resolved_hash_paths($hashes, $js);

		// load in static
		$hashes['static'] = \Config::get('materia.urls.static');

		// save
		\Config::save('asset_hash.json', $hashes);
	}

	// digs through the hash file and a qasset config to add hashes it resolves
	protected static function add_resolved_hash_paths(Array $hashes, Array $assets)
	{
		$keys = array_keys($hashes);
		foreach ($assets['groups'] as $key => $value)
		{
			foreach ($value as $asset)
			{
				foreach ($keys as $hash_key)
				{
					if (self::ends_with($asset, $hash_key))
					{
						$hashes[$asset] = $hashes[$hash_key];
					}
				}
			}
		}

		return $hashes;
	}

	// does a string end with another string?
	protected static function ends_with($haystack, $needle)
	{
		$length = strlen($needle);
		if ($length == 0)
		{
			return true;
		}

		return (substr($haystack, -$length) === $needle);
	}
}
