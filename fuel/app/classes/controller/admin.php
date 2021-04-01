<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Admin extends Controller
{
	use \Trait_RateLimit;

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
		$this->theme->get_template()->set('title', 'Widget Admin');
		$this->theme->set_partial('footer', 'partials/angular_alert');
		$this->theme->set_partial('content', 'partials/admin/widget')
			->set('upload_enabled', Config::get('materia.enable_admin_uploader', false))
			->set('heroku_warning', Config::get('materia.heroku_admin_warning', false));
	}

	public function get_user()
	{
		$this->theme->get_template()->set('title', 'User Admin');
		$this->theme->set_partial('footer', 'partials/angular_alert');
		$this->theme->set_partial('content', 'partials/admin/user');
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

		Session::set_flash('upload_notice',  ($failed ? 'Failed' : 'Success') );

		Response::redirect(URI::create('admin/widget'));
	}

	// ADD SUPPORT ONLY STUFF HERE?
	// only here so we can reuse admins stuff
	// but we can split it off if that makes more sense

	public function get_support()
	{
		// if ( ! \Materia\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Support');

		Css::push_group(['support']);
		Js::push_group(['react', 'support']);
	}
}
