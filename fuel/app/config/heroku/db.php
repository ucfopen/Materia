<?php
$url = parse_url($_ENV["CLEARDB_DATABASE_URL"]);
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
