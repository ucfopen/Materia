<?php
return [
	'send_emails' => false,
	'dirs' => [
		'media'   => PKGPATH.'materia/media/', // where the uploaded assets are kept
		'logs'    => PKGPATH.'materia/logs', // profile data is written here
		'engines' => PUBPATH.'widget/test/',
	],

	// build routes for static urls to use http://mymateria.com:8008
	'urls' => [
		'static'             => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()), // http://static.siteurl.com/
		'engines'            => preg_replace('/(http:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')), // engine swf locations
	],
];
