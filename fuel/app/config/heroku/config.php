<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	'log_threshold'    => Fuel::L_DEBUG,
	# send logs via STDOUT for heroku
	'log_handler_factory'   => function($locals, $level){ return new \Monolog\Handler\ErrorLogHandler(); },

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
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/enigma_a149e18d93df78ef775665ffdc02b6490f8faad5.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/enigma_a149e18d93df78ef775665ffdc02b6490f8faad5.wigt.yml',
		],
		[
			'id' => 5,
			'package'  => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/adventure_66631aca57d255eb61854b02b14c63604d8e8a66.wigt',
			'checksum' => 'https://ucfcdl-deploy-builds-public.s3.amazonaws.com/materia-widgets/adventure_66631aca57d255eb61854b02b14c63604d8e8a66.wigt.yml',
		],
	],
];
