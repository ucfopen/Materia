<?php
/*
	Single Signon Hash Utility

	This class is a implementation class to provide CDWS single signon authentication.
	Currently, it supports message digest for MD5 (default) and SHA-1. Critical error
	will throws exception. The non critical ones are available through getWarningMessage().

	This utility handles the generating and validating the single sign-on hash. The
	hash is generated from concatenating and message digesting a set of parameters,
	which need to be validated for no alternation, and a shared secret. During validation,
	it checks the hash value from the url parameter and the hash value created locally.

	The format of the secret is: 1234<PARAM1>098<PARAM2>44444...

	where <PARAM> is a hash parameter can be set in the secret string. Table below shows
	available predefined parameters.  You can add your own parameter in the secret as long as
	the URL parameter name in the request match the hash parameter name in the secret.

	Parameter Name		Description			URL parameter	Hash creation parameter
	-----------------------------------------------------------------------------
	userid				User ID					x*					x*
	timestamp			Time stamp				x*					x*
	hash				SSO authentication hash	x*

	* Required fields

	Here are the code snippet on using SsoHash class.

	For sender application generating the parameter set with SSO credential:

	$sso = new SsoHash('somesecret');
	$id = 'ab11111';
	$tstamp = time();
	$params = [];
	$params[SsoHash::USERID] = $id;
	$params[SsoHash::TIME] = $tstamp;
	$url_str = $sso->get_sso_out_parameters_as_string($params);

	For receiver application validating the SSO credential from a request:

	$sso = new SsoHash('somesecret');
	$sso_req = $sso->getSsoInParametersFromRequest();
	$valid = $sso->validate($sso_req);

	if ($valid)
	{
		$userid = $sso_req[SsoHash::USERID];
		...
	} else {
		...
	}
*/
namespace Auth;

class Sso
{
	// SSO parameters names constants
	const USERID    = 'userid';
	const TIME      = 'timestamp';
	const HASH      = 'hash';
	const TIMEOUT   = 60; // seconds

	static public $schema  = 'MD5';// message digest schema

	/*
	 * Get SSO data as array (including hash).
	 *
	 * Param	$params		Array contains SSO data
	 * Returns 	Array contains SSO data (including hash).
	 */
	static public function get_sso_out_parameters_as_array($params, $secret)
	{
		$params[self::HASH] = self::generate_hash($params, $secret);
		return $params;
	}

	/*
	 * Get URL encoded SSO data as string (including hash).
	 *
	 * Param	$params		Array contains SSO data
	 * Returns 	URL encoded SSO string (including hash).
	 */
	static public  function get_sso_out_parameters_as_string($params, $secret)
	{
		$params[self::HASH] = self::generate_hash($params, $secret);
		return self::convert_map2_string($params);
	}

	/*
	 * Convert array to url encoded string
	 *
	 * Param	$params		Array
	 * Returns	URL encoded string
	 */
	static private function convert_map2_string($arr)
	{
		$string = '';
		foreach ($params as $key => $val)
		{
			$string .= urlencode($key).'='.urlencode($val).'&';
		}
		return rtrim($string,'&'); // remove the last &
	}

	/*
	 * Validate SSO request by $_REQUEST. Exception will be thrown if the $_REQUEST
	 * data are invalid.
	 *
	 * Returns true if valid.
	 */
	static public function validate_ssohash_from_request($secret)
	{
		return self::validate( self::get_sso_parameters_from_req(), $secret);
	}

	static public function generate_hash($params, $secret)
	{
		// Replace key tokens
		foreach ($params as $key => $val)
		{
			$secret = str_ireplace('<$key>', $val, $secret);
		}

		// Set timestamp if it is in secret but is missing in the parameter list.
		if (stripos($secret, self::TIME) > 0) $secret = str_ireplace('<'.self::TIME.'>', time(), $secret);

		// Do the MD
		if (self::$schema == 'MD5') $outstr = md5($secret);
		else if (self::$schema == 'SHA1') $outstr = sha1($secret);
		else throw new \Exception('Invalid Message Digest');

		return $outstr;
	}

	static public function get_sso_parameters_from_req()
	{
		return [
			self::USERID => \Input::param(self::USERID, ''),
			self::TIME   => (int) \Input::param(self::TIME, ''),
			self::HASH   => \Input::param(self::HASH, ''),
		];
	}

	static public function on_auth_module_validate_sso($params)
	{
		trace('rdSSO checking sso');
		if (empty($params['consumerid'])) return false;
		try
		{
			$secret = \Config::get('sso.secrets.'.$params['consumerid']);
			$valid = self::validate($params, $secret);
			\RocketDuck\Log::profile([$params['userid'],'SSO', $valid?'1':'0'], 'login');
			return $valid;
		}
		catch (\Exception $e)
		{
			trace($e);
			return false;
		}
	}

	static public function validate($params, $secret)
	{
		if ( ! self::check_input($params[self::USERID], '/[[:alnum:]]{2,15}/')) throw new \Exception('Invalid user id');
		if ( ! self::check_input($params[self::TIME], '/[[:digit:]]{10,11}/')) throw new \Exception('Invalid timestamp');
		if ( ! self::check_input($params[self::HASH], '/[[:alnum:]]{16,64}/')) throw new \Exception('Invalid SSO token');
		if ( ! preg_match('/<'.self::USERID.'>/', $secret) || ! preg_match('/<'.self::TIME.'>/', $secret)) throw new \Exception('Invalid Secret');

		// if older then time limit, invalid
		if ((time() - $params[self::TIME] ) > self::TIMEOUT) return false;
		else return $params[self::HASH] == self::generate_hash($params, $secret);
	}

	/*
	 * Private methods
	 *
	 */
	static private function check_input($data, $pattern)
	{
		if (is_null($data) || is_null($pattern)) return false;
		else return preg_match($pattern, $data);
	}
}