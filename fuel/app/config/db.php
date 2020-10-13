<?php

// all files in heroku/config are copied to config/production on heroku
// they will overwrite any files already in config/production
$conn = $_ENV["DATABASE_URL"] ?? $_ENV["JAWSDB_URL"] ?? $_ENV["CLEARDB_DATABASE_URL"] ?? 'mysql://user:pass@host/dbname';
$url = parse_url($conn);
$server = $url["host"];
$username = $url["user"];
$password = $url["pass"];
$db = substr($url["path"], 1);

return [
	'active' => 'default',

	'default' => [
		'connection'  => [
			'dsn'       => "mysql:host={$server};port=3306;dbname={$db}",
			'username'  => $username,
			'password'  => $password,
		],
		'type'         => 'pdo',
		'identifier'   => '`',
		'table_prefix' => '',
		'charset'      => 'utf8',
		'caching'      => false,
		'profiling'    => false,
	],
];
