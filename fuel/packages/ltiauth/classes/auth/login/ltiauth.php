<?php

class LtiAuthUserUpdateException extends \FuelException {}

class Auth_Login_LtiAuth extends Auth_Login_Materiaauth
{
	static public function restrict_logins($bypass=false)
	{
		// allow admin logins or do nothing if normal logins aren't restricted
		if ($bypass || ! \Config::get('auth.restrict_logins_to_lti_single_sign_on', true)) return;

		throw new \HttpNotFoundException();
	}
}
