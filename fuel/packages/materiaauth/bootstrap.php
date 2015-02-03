<?php
// lets use our login lang before the main one
\Config::set('materia.lang_path.login', PKGPATH.'materiaauth');
Autoloader::add_classes([
	'Sso'                        => __DIR__.'/classes/sso.php',
	'Auth_Login_Materiaauth'         => __DIR__.'/classes/auth/login/materiaauth.php',
	'MateriaAuthUserUpdateException' => __DIR__.'/classes/auth/login/materiaauth.php',
	'Auth_Group_Materiagroup'        => __DIR__.'/classes/auth/group/materiagroup.php',
	'Auth_Acl_Materiaacl'            => __DIR__.'/classes/auth/acl/materiaacl.php',
]);
\Event::register('lti_get_or_create_user', 'Auth_Login_Materiaauth::get_synced_user');
