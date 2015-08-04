<?php

class Alwaysload
{

	// called when loaded
	public static function _init()
	{
		// initialize the lti event listener
		Event::register('score_updated', '\Lti\LtiEvents::on_score_updated_event');
		Event::register('widget_instance_delete', '\Lti\LtiEvents::on_widget_instance_delete_event');
		Event::register('play_completed', '\Lti\LtiEvents::on_play_completed_event');
		Event::register('before_play_start', '\Lti\LtiEvents::on_before_play_start_event');
		Event::register('play_start', '\Lti\LtiEvents::on_play_start_event');

		// load in the language file we need
		// this setup allows packages to override settings
		// to override in a package use Config::set('materia.lang_path.login', value); in the bootstrap
		Lang::load(Config::get('materia.lang_path.login').DS.'lang'.DS.'en'.DS.'login.php', 'login');

	}

}