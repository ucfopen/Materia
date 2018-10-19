<?php

return [
	'profiling'  => false,

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
	'log_threshold' => Fuel::L_ALL,

	// allows you to create a custom error handler for Monolog
	// THIS WILL SEND ERRORS TO STDOUT, VISIBLE VIA `docker-compose log phpfpm`
	// This is being disabled till we upgrade to php 7.2 as there is a bugfix in phpfpm to make this work better
	// see https://github.com/docker-library/php/issues/207 and https://github.com/php/php-src/pull/1076
	// 'log_handler_factory'   => function($locals, $level){ return new \Monolog\Handler\ErrorLogHandler(); },

	'widgets' => [
		[
			'id' => 1,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/crossword_1a9a888e5d540e4a8eeea6575abf6ea1170bba50.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/crossword_1a9a888e5d540e4a8eeea6575abf6ea1170bba50.wigt.yml',
		],
		[
			'id' => 2,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/hangman_8150b16085050dde81a7c727b8b946a679082895.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/hangman_8150b16085050dde81a7c727b8b946a679082895.wigt.yml',
		],
		[
			'id' => 3,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/matching_e7b6fa775eb54427045fff136a33c179affc681d.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/matching_e7b6fa775eb54427045fff136a33c179affc681d.wigt.yml',
		],
		[
			'id' => 4,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/enigma_8d63e47cdef1297da78c4e5f36e3507edc2c0e4e.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/enigma_8d63e47cdef1297da78c4e5f36e3507edc2c0e4e.wigt.yml',
		],
		[
			'id' => 5,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/labeling_3bb91ca43aef61e252c58015631fb3cbc713badf.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/labeling_3bb91ca43aef61e252c58015631fb3cbc713badf.wigt.yml',
		],
	],
];
