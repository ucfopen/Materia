<?php

return array(

	'enable_mod_xsendfile' => true,
	'enable_x_accel'       => true,

	'basedir' => APPPATH,
	'areas' => [

		 'media' => [
			'basedir'    => \Config::get('materia.dirs.media').'uploads',
			'extensions' => array('jpg', 'jpeg', 'png', 'gif', 'wav', 'mp3'),
			'url'        => DOCROOT . 'media',
		]
	],

);
