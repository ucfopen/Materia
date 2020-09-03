<?php

class Cookie extends Fuel\Core\Cookie
{

	/**
	 * Sets a signed cookie. Note that all cookie values must be strings and no
	 * automatic serialization will be performed!
	 *
	 *     // Set the "theme" cookie
	 *     Cookie::set('theme', 'red');
	 *
	 * @param   string    $name        name of cookie
	 * @param   string    $value       value of cookie
	 * @param   integer   $expiration  lifetime in seconds
	 * @param   string    $path        path of the cookie
	 * @param   string    $domain      domain of the cookie
	 * @param   boolean   $secure      if true, the cookie should only be transmitted over a secure HTTPS connection
	 * @param   boolean   $http_only   if true, the cookie will be made accessible only through the HTTP protocol
	 * @param   string    $same_site   SameSite value for the cookie
	 * @return  boolean
	 */
	public static function set($name, $value, $expiration = null, $path = null, $domain = null, $secure = null, $http_only = null, $same_site = 'None')
	{
		// you can't set cookies in CLi mode
		if (\Fuel::$is_cli)
		{
			return false;
		}

		$value = \Fuel::value($value);

		// use the class defaults for the other parameters if not provided
		is_null($expiration) and $expiration = static::$config['expiration'];
		is_null($path) and $path = static::$config['path'];
		is_null($domain) and $domain = static::$config['domain'];
		//hack - it looks like Fuel makes it pretty difficult to actually set 'Secure' to 'true' in cookies
		// and since static::$config is protected we can't override it to default to 'true' instead of 'false'
		// except secure cookies can only be sent across HTTPS
		is_null($secure) and $secure = isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : false;
		// is_null($secure) and $secure = static::$config['secure'];
		is_null($http_only) and $http_only = static::$config['http_only'];
		//static::$config is protected - can't get it in an extended class, hack workaround here
		is_null($same_site) and $same_site = 'None';

		// add the current time so we have an offset
		$expiration = $expiration > 0 ? $expiration + time() : 0;

		// make sure same_site isn't None when cookie isn't secure
		if(!$secure && $same_site === 'None') $same_site = 'Strict';

		//setcookie readily supports SameSite in 7.3 and up, big hacks necessary any earlier than that
		if( version_compare(phpversion(), '7.3', '<'))
		{
			return setcookie($name, $value, $expiration, $path.'; SameSite='.$same_site, $domain, $secure, $http_only);
		}
		else
		{
			$cookie_options = [
				'expires' => $expiration,
				'path' => $path,
				'domain' => $domain,
				'secure' => $secure,
				'httponly' => $http_only,
				'samesite' => $same_site
			];
			return setcookie($name, $value, $cookie_options);
		}
	}

	/**
	 * Deletes a cookie by making the value null and expiring it.
	 *
	 *     Cookie::delete('theme');
	 *
	 * @param   string   $name       cookie name
 	 * @param   string   $path       path of the cookie
	 * @param   string   $domain     domain of the cookie
	 * @param   boolean  $secure     if true, the cookie should only be transmitted over a secure HTTPS connection
	 * @param   boolean  $http_only  if true, the cookie will be made accessible only through the HTTP protocol
	 * @param   string   $same_site   SameSite value for the cookie
	 * @return  boolean
	 * @uses    static::set
	 */
	public static function delete($name, $path = null, $domain = null, $secure = null, $http_only = null, $same_site = 'None')
	{
		// Remove the cookie
		unset($_COOKIE[$name]);

		// Nullify the cookie and make it expire
		return static::set($name, null, -86400, $path, $domain, $secure, $http_only, $same_site);
	}
}
