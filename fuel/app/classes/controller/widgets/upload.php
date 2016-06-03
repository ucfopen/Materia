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
		if (Config::get('enable_uploader', false) == false || Fuel::$env == Fuel::PRODUCTION) throw new HttpNotFoundException;

		if (\Model_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
			return;
		}
	}

	/**
	 * Interface for sideloading widgets into Materia
	 *
	 * @login Required
	 *
	 * TODO: Clean this up, make it less dirty
	 */
	public function get_index()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');

		Css::push_group(['core', 'upload']);
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		$this->theme->get_template()
			->set('title', 'Upload a widget')
			->set('page_type', 'upload');

		$this->theme->set_partial('content', 'partials/upload');

		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$me = Model_User::find_current();

			$this->theme->set_partial('header', 'partials/header')->set('me', $me);

			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			$response = Response::forge(Theme::instance()->render());
		}
		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

		return parent::after($response);

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
				if ( ! Materia\Widget_Installer::extract_and_install_from_package($path))
				{
					$failed = true;
					break;
				}
			}
		}

		Session::set_flash('notice',  ($failed ? 'Failed' : 'Success') );
		Response::redirect(Router::get('widgets/upload'));
	}
}

