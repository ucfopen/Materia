<?php
return [
	// Route for testing what Materia looks like using the embed code
	'test/external/(:alnum)(/.*)?' => 'widgets/test/external/$1',

	// route to view all availible routes
	'dev/routes' => function(){
		echo "<html><head><title>Materia Routes</title></head><body><ol>";
		foreach(Router::$routes as $r) {
			echo("<li><b>{$r->name}</b>: {$r->path}</li>");
		}
		echo "</ol></body></html>";
	},

	// route to view phpinfo
	'dev/php-info' => function(){
		phpinfo();
	},
];
