<?php
// lets use our login lang before the main one
Autoloader::add_classes([
	'Auth_Login_Materiaauth'         => __DIR__.'/classes/auth/login/materiaauth.php',
	'MateriaAuthUserUpdateException' => __DIR__.'/classes/auth/login/materiaauth.php',
]);
\Event::register('lti_get_or_create_user', 'Auth_Login_Materiaauth::get_synced_user');
