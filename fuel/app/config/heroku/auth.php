<?php
// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
return [
	// Use your own salt for security reasons
	'salt' => $_ENV['MATERIA_AUTH_SALT'],
];
