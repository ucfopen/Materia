<?php

// Enable this class in config.always_load.classes if needed
class Alwaysload
{

	// called when loaded
	// a good place to do initialization
	public static function _init()
	{
		\Config::load('materia', true); // Always load is loaded before configs listed in config.always_load.configs
	}
}