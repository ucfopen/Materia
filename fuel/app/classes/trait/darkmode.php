<?php
/**
 * Materia
 * License outlined in licenses folder
 */

trait Trait_DarkMode
{
	protected function is_using_darkmode()
	{
		if (\Service_User::verify_session() == true)
		{
			$meta = \Model_User::find_current()->profile_fields;
			$darkmode = ! empty($meta['darkMode']) && $meta['darkMode'];
			return $darkmode;
		}
		else return false;
	}
}