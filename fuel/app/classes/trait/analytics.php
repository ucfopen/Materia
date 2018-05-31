<?php
/**
 * Materia
 * License outlined in licenses folder
 */

trait Trait_Analytics
{
	protected function insert_analytics()
	{
		if ($gid = Config::get('materia.google_tracking_id', false))
		{
			$this->theme->set_partial('google_analytics', 'partials/google_analytics')
				->set('id', $gid);
		}
	}

}
