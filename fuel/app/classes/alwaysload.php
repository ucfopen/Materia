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

		Lang::load('login', 'login');

	}

}