<?php
return [
	'log_threshold'    => Fuel::L_DEBUG,
	# send logs via STDOUT for heroku
	'log_handler_factory'   => function($locals, $level){ return new \Monolog\Handler\ErrorLogHandler(); },

	'enable_uploader' => ($_ENV['MATERIA_ENABLE_UPLOADER'] === 'true')
];
