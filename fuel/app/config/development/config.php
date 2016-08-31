<?php

return [
	'profiling'  => false,
	'base_url'  => 'http://localhost/',

	/**
	 * Logging Threshold.  Can be set to any of the following:
	 *
	 * Fuel::L_NONE
	 * Fuel::L_ERROR
	 * Fuel::L_WARNING
	 * Fuel::L_DEBUG
	 * Fuel::L_INFO
	 * Fuel::L_ALL
	 */
	'log_threshold'    => Fuel::L_ALL,

	/* Always Load                                                            */
	/**************************************************************************/
	// 'always_load' => [
	// 	'packages' => [
	// 	],
	// ],
	// 'packages'  => array(
	// ),
	'enable_uploader' => true
];
