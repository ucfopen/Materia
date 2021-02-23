<?php
return [
	// Route for testing what Materia looks like using the embed code
	'test/external/(:alnum)(/.*)?' => 'widgets/test/external/$1',

	'dev' => function(){
		?>
		<html>
			<head>
				<title>Materia Dev Tools</title>
			</head>
			<body>
				<h1>Materia Development Tools</h1>
				<p>Note: these routes only exist when using Materia in the 'development' environment mode.</p>
				<ul>
				<li><a href="/dev/routes">Registered Fuel Routes</a></li>
				<li><a href="/dev/php-info">phpinfo</a></li>
				<li><a href="/lti/test/provider">LTI Launch Tool</a></li>
				</ul>
			</body>
		</html>
		<?php
	},

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
