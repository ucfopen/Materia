<?php
return array(
	'phpunit' => array(
		// we're not using any autoloading paths, this is only here to prevent oil from erroring when it can't load this file
		'autoload_path' => APPPATH.'classes'.DS.'materia'.DS.'log.php' ,
		# and turn on the zend_extension for xdebug so we can get code coverage
		'binary_path' => 'php -dzend_extension=xdebug.so '.VENDORPATH.'bin/phpunit',
	),
);

