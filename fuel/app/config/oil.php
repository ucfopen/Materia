<?php
return array(
	'phpunit' => array(
		'autoload_path' => 'PHPUnit/Autoload.php' ,
		# Load phpunit from the vendor path
		# and turn on the zend_extension for xdebug so we can get code coverage
		'binary_path' => 'php -dzend_extension=xdebug.so '.VENDORPATH.'bin/phpunit',
	),
);

