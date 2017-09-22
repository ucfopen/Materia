<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Admin extends Controller
{

	use Trait_CommonControllerTemplate {
		before as public common_before;
	}

	public function before()
	{
		$this->common_before();
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;
		Css::push_group('admin');
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'admin', 'author', 'student']);
		parent::before();
	}

	public function get_widget()
	{
		$this->theme->get_template()->set('title', 'Widget Admin');
		$this->theme->set_partial('content', 'partials/admin/widget')
			->set('upload_enabled', Config::get('enable_uploader', false));
	}

	public function get_user()
	{
		$this->theme->get_template()->set('title', 'User Admin');
		$this->theme->set_partial('content', 'partials/admin/user');
	}

	public function post_upload()
	{
		// require the enable_uploader option to be on
		if (Config::get('enable_uploader', false) !== true) throw new HttpNotFoundException;

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

		Session::set_flash('upload_notice',  ($failed ? 'Failed' : 'Success') );

		Response::redirect(URI::create('admin/widget'));
	}
}
