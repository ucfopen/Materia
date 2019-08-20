<?php
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

	public static function get_avatar($size=35, $user=false)
	{
		$default = \Config::get('materia.urls.static').'/img/default-avatar.jpg';
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


}
