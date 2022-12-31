<?php
// Read https://fuelphp.com/docs/classes/event.html for more info about event configuration

return [

	'fuelphp' => [
		// LTI Events
		'score_updated'               => '\LtiEvents::on_score_updated_event',
		'widget_instance_delete'      => '\LtiEvents::on_widget_instance_delete_event',
		'play_completed'              => '\LtiEvents::on_play_completed_event',
		'before_play_start'           => '\LtiEvents::on_before_play_start_event',
		'play_start'                  => '\LtiEvents::on_play_start_event',
		'before_score_display'        => '\LtiEvents::on_before_score_display_event',
		'before_single_score_review'  => '\LtiEvents::on_before_single_score_review'

		/*
		'app_created' => function()
		{
			// After FuelPHP initialised
		},
		'request_created' => function()
		{
			// After Request forged
		},
		'request_started' => function()
		{
			// Request is requested
		},
		'controller_started' => function()
		{
			// Before controllers before() method called
		},
		'controller_finished' => function()
		{
			// After controllers after() method called
		},
		'response_created' => function()
		{
			// After Response forged
		},
		'request_finished' => function()
		{
			// Request is complete and Response received
		},
		'shutdown' => function()
		{
			// Output has been send out
		},
		*/
	],
];
