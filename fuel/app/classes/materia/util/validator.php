<?php
/**
 * Materia
 *
 * It's a thing
 *
 * @package    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * NEEDS DOCUMENTATION
 *
 * NEEDS DOCUMENTATION
 *
 * @package	    Core
 * @subpackage  util
 */

namespace Materia;

class Util_Validator
{
	/**
	* Checks To See If $var Is A Whole Integer This Includes Negative Numbers.
	* 23 		-> True
	*  23.5 	-> False
	*  -2		-> True
	*  "23" 	-> True
	*  "23a"	-> False
	*  Null		-> False
	*  ""		-> False
	*  "-2"		-> True
	* 0		-> True
	*
	* @param Mixed Needs Documenation
	*
	* @return Bool True If $var Is An Whole Integer
	* @return Bool False If $var Is Not An Whole Integer
	*/
	public static function is_int(&$var)
	{
		if ( ! is_numeric($var)) return false;
		$var = floatval($var);
		return $var == floor($var);
	}

	/**
	* Checks to see if $var is a positive whole integer.
	* 23 		-> true
	* 23.5 	-> false
	* -2		-> false
	* "23" 	-> true
	* "23a"	-> false
	* NULL		-> false
	* ""		-> false
	* "-2"		-> false
	* 0		-> false
	*
	* @param mixed   NEEDS DOCUMENTATION
	* @param unknown NEEDS DOCUMENTATION
	*
	* @return bool true if $var is an positve whole integer
	* @return bool false if $var is not an whole integer or it is negative
	*/
	public static function is_pos_int(&$var, $zero = false)
	{
		return self::is_int($var) && ($zero ? $var >= 0 : $var > 0);
	}

	/**
	* Ensures $hash is a valid alphanumeric, five-character string
	*
	* @param string 	the hash to be validated
	* @return bool 	true if the hash is a valid string
	* @return bool 	false if the hash is an invalid string
	*
	*/
	public static function is_valid_hash($hash)
	{
		// matches any alphanumeric string between 1 and 5 characters EXCEPT 0.
		$pattern = '/^([A-Za-z0-9]{2,5}|[A-Za-z1-9]{1})\z/';

		if ((is_numeric($hash) && self::is_pos_int($hash) ) || (is_string($hash) && preg_match($pattern, $hash, $match) == 1))
		{
			return true;
		}

		return false;
	}

	/**
	* Ensures $long_hash is a valid base64 hash and supports old play ids.
	* cant just be '0' or '-'
	* cant start with '-'
	* only contains alphanum and - characters
	* Can also be a uuid v4
	*
	* @param string 	the hash to be validated
	* @return bool 	true if the hash is a valid string
	* @return bool 	false if the hash is an invalid string
	*
	*/
	public static function is_valid_long_hash($long_hash)
	{
		if ( ! self::is_string($long_hash)) return false;
		if ($long_hash === '0') return false;
		$pattern = '/^[A-Za-z0-9][A-Za-z0-9-]*\z/';
		return (preg_match($pattern, $long_hash, $match) === 1);
	}

	public static function is_string($var)
	{
		return is_string($var) && strlen($var) > 0;
	}

	public static function is_md5($var)
	{
		return (bool) preg_match('/^[[:alnum:]]{32}$/i', $var);
	}

	public static function is_sha1($var)
	{
		return (bool) preg_match('/^[[:alnum:]]{40}$/i', $var);
	}

	public static function cast_to_bool_enum($var)
	{
		return $var == '1' ? '1' : '0';
	}

}
