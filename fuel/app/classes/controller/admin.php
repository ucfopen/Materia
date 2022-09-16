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
		if ( ! (\Materia\Perm_Manager::is_super_user() || \Materia\Perm_Manager::is_support_user()) ) throw new \HttpNotFoundException;
		Css::push_group('admin');
		Js::push_group(['angular', 'materia', 'admin']);
		parent::before();
	}

	public function get_widget()
	{
		if ( ! \Materia\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;
	
		JS::push_inline('var UPLOAD_ENABLED ="'.Config::get('materia.enable_admin_uploader').'";');
		JS::push_inline('var HEROKU_WARNING ="'.Config::get('materia.heroku_admin_warning').'";');
		JS::push_inline('var ACTION_LINK ="/admin/upload";');
		Js::push_inline('var UPLOAD_NOTICE = "'.Session::get_flash('upload_notice').'";');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Widget Admin');

		// Css::push_group(['widget-admin']);
		Js::push_group(['react', 'widget_admin']);
	}

	public function get_user()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'User Admin');

		Css::push_group(['user-admin']);
		Js::push_group(['react', 'user_admin']);
	}

	public function post_upload()
	{
		if ( ! \Materia\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;
		if (Config::get('materia.enable_admin_uploader', false) !== true) throw new HttpNotFoundException;

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
		
		if ($failed) 
		{
			throw new HttpServerErrorException;
		}

		Session::set_flash('upload_notice',  ($failed ? 'Failed' : 'Success') );

		Response::redirect('admin/widget');
	}

	// public function get_support()
	public function get_instance()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Instance Admin');

		Css::push_group(['support']);
		Js::push_group(['react', 'support']);
	}
}
