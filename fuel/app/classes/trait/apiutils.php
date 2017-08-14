<?php
/**
 * Materia
 * License outlined in licenses folder
 */

trait Trait_Apiutils
{
	protected function no_cache()
	{
		$this->response->set_header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
		$this->response->set_header('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
		$this->response->set_header('Pragma', 'no-cache');
	}

}
