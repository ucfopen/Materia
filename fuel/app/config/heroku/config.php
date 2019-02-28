<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	'log_threshold'    => Fuel::L_DEBUG,
	# send logs via STDOUT for heroku
	'log_handler_factory'   => function($locals, $level){ return new \Monolog\Handler\ErrorLogHandler(); },

];
