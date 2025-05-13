<?php

class LtiAuthUserUpdateException extends \FuelException {}

class Auth_Login_LtiAuth extends Auth_Login_Materiaauth
{
	static public function restrict_logins($bypass=false)
	{
		// this method can be extended to limit logins
		// the prior restrict_logins_to_lti_single_sign_on configuration check that was present here has been moved:
		// the user and widget controllers perform the config check and serve different js based on whether the condition is met.
		return;
	}
}
