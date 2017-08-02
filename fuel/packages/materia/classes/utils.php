<?php
/**
 * Materia
 * It's a thing
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * NEEDS DOCUMENTATION
 *
 * General utilities that are needed but don't fit anywhere else
 *
 * @package	    Main
 * @subpackage  scoring
 * @author      ggalperi
 */

namespace Materia;

class Utils
{
	/**
	 * Will get a listing of all semesters and the date range (timestamps) associated with them.
	 *
	 * @return array  year/semster/start/end
	 */
	 public static function get_date_ranges()
	 {
		return \DB::select('year', 'semester', ['start_at', 'start'], ['end_at', 'end'])
			->from('date_range')
			->order_by('id')
			->execute()
			->as_array();
	}

	public static function get_avatar($size=24, $user=false)
	{
		$default = \Config::get('materia.urls.static_crossdomain').'/img/default-avatar.jpg';
		if ( ! $user) $user = \Model_User::find_current();
		if ($user instanceof \Model_User && ! empty($user->profile_fields['useGravatar']))
		{
			return 'https://secure.gravatar.com/avatar/'.md5(strtolower($user->email)).'?s='.$size.'&d=retro';
		}
		else
		{
			return $default;
		}
	}

	public static function load_methods_from_file($file)
	{
		// build a sheltered scope to try and "safely" load the contents of the file
		$safe_load = function($file)
		{
			$result = [];
			$methods = include($file);

			if (is_array($methods))
			{
				foreach ($methods as $name => &$method)
				{
					if (is_callable($method)) $result[$name] = $method;
				}
			}

			return $result;
		};

		return $safe_load($file);
	}
}
