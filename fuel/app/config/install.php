<?php
return [
	// what permission to set on the writable_paths
	'writable_file_perm' => 0777,

	// which paths should have the above perm applied to them
	'writable_paths' => [
		APPPATH.'cache',
		APPPATH.'logs',
		APPPATH.'tmp',
		APPPATH.'config',
		// media directories
		\Config::get('file.dirs.media'),
		\Config::get('file.dirs.media_uploads'),
		// widget directories
		\Config::get('file.dirs.widgets'),
		\Config::get('file.dirs.widgets').'test',
	]
];
