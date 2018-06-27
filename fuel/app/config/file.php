<?php
return array(

	'enable_mod_xsendfile' => true,
	'enable_x_accel'       => true,

	/*
	*  Directories of varous assets
	*/
	'dirs' => [
		'media'         => realpath(APPPATH.'media').DS, // dont forget to update areas.media.basdir below!
		'media_uploads' => realpath(APPPATH.'media'.DS.'uploads').DS,
		'widgets'       => realpath(PUBPATH.'widget').DS,
	],

	'basedir' => APPPATH,
	'areas' => [

		 'media' => [
			'basedir'    => realpath(APPPATH.'media').DS,
			'extensions' => ['jpg', 'jpeg', 'png', 'gif', 'wav', 'mp3'],
			'url'        => DOCROOT . 'media',
		]
	],

);
