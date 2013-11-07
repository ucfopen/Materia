<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Site extends Controller
{

	public function before()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$me = Model_User::find_current();
			if ($me)
			{
				// add beardmode
				if (isset($me->profile_fields['beardmode']) && $me->profile_fields['beardmode'] == 'on')
				{
					Casset::js_inline('var BEARD_MODE = true;');
					Casset::js_inline('var beards = ["black_chops", "dusty_full", "grey_gandalf", "red_soul"];');
					Casset::css('beard_mode.css', false, 'page');
				}
			}
			$this->theme->set_partial('header', 'partials/header')->set('me', $me);

			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Casset::js_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			Casset::js_inline('var BASE_URL = "'.Uri::base().'";');
			$response = Response::forge(Theme::instance()->render());
		}

		return parent::after($response);
	}

	/**
	 * Handles the homepage
	 *
	 */
	public function action_index()
	{
		Package::load('casset');
		Casset::enable_js(['homepage']);
		Casset::enable_css(['homepage']);

		$this->theme->get_template()
			->set('title', 'Welcome to Materia')
			->set('page_type', 'store');

		$this->theme->set_partial('content', 'partials/homepage');
	}

	public function action_permission_denied()
	{
		Package::load('casset');
		Casset::enable_js(['homepage']);
		Casset::enable_css(['homepage']);

		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/nopermission');
	}

	public function action_help()
	{
		Package::load('casset');
		Casset::enable_js(['help']);
		Casset::enable_css(['help']);

		$this->theme->get_template()
			->set('title', 'Help')
			->set('page_type', 'docs help');

		$this->theme->set_partial('content', 'partials/help/main');
	}

	/**
	 * Load the login screen and possibly widget information if it's needed
	 */
	public function action_404()
	{
		Package::load('casset');
		Casset::enable_css(['404']);

		$this->theme->get_template()
			->set('title', '404 Page not Found')
			->set('page_type', '404');

		$this->theme->set_partial('content', 'partials/404');

		Log::warning("404 URL: ". Uri::main());
	}

	public function action_crossdomain()
	{
		Package::load('casset');
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/crossdomain');
		$response = Response::forge($this->theme->render());
		$response->set_header('Content-Type', 'application/xml');
		return $response;
	}
}