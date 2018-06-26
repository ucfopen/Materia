<?php

return array(
	// maximum size of the uploaded file in bytes. 0 = no maximum
	'max_size'			=> 0,

	// list of file extensions that a user is allowed to upload
	'ext_whitelist' => \Config::get('files.areas.media.extensions')

	// default path the uploaded files will be saved to
	'path'				=> \Config::get('files.areas.media.basedir'),

	// permissions to be set on the path after creation
	'path_chmod'		=> 0777,

	// permissions to be set on the uploaded file after being saved
	'file_chmod'		=> 0666,

	// if true, generate a random filename for the file being saved
	'randomize'			=> true,
);
