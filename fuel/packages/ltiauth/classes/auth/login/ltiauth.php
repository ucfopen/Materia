<?php

class LtiAuthUserUpdateException extends \FuelException {}

class Auth_Login_LtiAuth extends Auth_Login_Materiaauth
{

	static public function restrict_logins($bypass=false)
	{
		// allow admin logins
		if ($bypass || \Config::get('auth.allow_logins', false)) return;

		Response::redirect('403');
	}
}
