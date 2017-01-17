<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets_Upload extends Controller
{
	public function before()
	{
		// require the enable_uploader option to be on
		if (Config::get('enable_uploader', false) == false
		|| Fuel::$env == Fuel::PRODUCTION
		|| ! \RocketDuck\Perm_Manager::is_super_user()) throw new HttpNotFoundException;
	}

	public function post_index()
	{
		// Custom configuration for this upload
		$config = [
			'path'          => '/tmp/',
			'randomize'     => true,
			'ext_whitelist' => ['wigt'],
		];

		// process the uploaded files in $_FILES
		Upload::process($config);

		$failed = true;

		// if there are any valid files
		if (Upload::is_valid())
		{
			$failed = false;
			// save them according to the config
			Upload::save();

			foreach (Upload::get_files() as $file)
			{
				$path = $file['saved_to'].$file['saved_as'];
				if ( ! Materia\Widget_Installer::extract_package_and_install($path))
				{
					$failed = true;
					break;
				}
			}
		}

		Session::set_flash('notice',  ($failed ? 'Failed' : 'Success') );
		Response::redirect(URI::create('admin/'));
	}
}

