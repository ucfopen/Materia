<?php

return array(

	'enable_mod_xsendfile' => true,
	'enable_x_accel'       => true,

	'basedir' => APPPATH,
	'areas' => [

		 'media' => [
			'basedir'    => PKGPATH . 'materia/media/',
			'extensions' => array('jpg', 'jpeg', 'png', 'gif', 'wav', 'mp3', 'swf', 'flv'),
			'url'        => DOCROOT . 'media',
		]
	],

);
