<?php
// lets use our login lang before the main one
Autoloader::add_classes([
	'Auth_Login_LtiAuth'         => __DIR__.'/classes/auth/login/ltiauth.php',
	'LtiAuthUserUpdateException' => __DIR__.'/classes/auth/login/ltiauth.php',
]);
\Event::register('request_login', 'Auth_Login_LtiAuth::restrict_logins');
