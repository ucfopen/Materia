<?php

return array(

	'enable_mod_xsendfile' => true,
	'enable_x_accel'       => true,

	'basedir' => APPPATH,
	'areas' => [

		 'media' => [
			'basedir'    => realpath(APPPATH.'media').DS,
			'extensions' => ['jpg', 'jpeg', 'png', 'gif', 'wav', 'mp3'],
			'url'        => DOCROOT . 'media',
		]
	],

);
