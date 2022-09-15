<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Site extends Controller
{
	use Trait_CommonControllerTemplate;

	/**
	 * Handles the homepage
	 *
	 */
	public function action_index()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Welcome to Materia');

		Css::push_group(['homepage']);
		Js::push_group(['react', 'homepage']);
	}

	public function action_permission_denied()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		Js::push_group(['react', 'no_permission']);
	}

	public function action_help()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');

		$this->theme->get_template()
			->set('title', 'Help')
			->set('page_type', 'docs help');

		// check to see if a theme override exists for the help page
		$theme_overrides = \Event::Trigger('before_help_page', '', 'array');

		if ($theme_overrides)
		{
			Js::push_group(['react', $theme_overrides[0]['js']]);
			Css::push_group($theme_overrides[0]['css']);
		}
		else
		{
			Js::push_group(['react', 'help']);
			Css::push_group('help');
		}
	}

	public function action_403()
	{
		Css::push_group('errors');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', '403 Not Authorized')
			->set('page_type', '404');

		Js::push_group(['react', '404']);

		Log::warning('403 URL: '.Uri::main());

		$response = \Response::forge(\Theme::instance()->render(), 404);

		return $response;
	}

	/**
	 * Show 404 page
	 */
	public function action_404()
	{
		Css::push_group('errors');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', '404 Page Not Found')
			->set('page_type', '404');

		Js::push_group(['react', '404']);

		Log::warning('404 URL: '.Uri::main());

		$response = \Response::forge(\Theme::instance()->render(), 404);

		return $response;
	}

	/**
	 * Show 500 page
	 */
	public function action_500()
	{
		Css::push_group('errors');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', '500 Server Error')
			->set('page_type', '500');

		Js::push_group(['react', '500']);

		Log::warning('500 URL: '.Uri::main());

		$response = \Response::forge(\Theme::instance()->render(), 500);

		return $response;
	}

	public function action_crossdomain()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/crossdomain');
		$response = Response::forge($this->theme->render());
		$response->set_header('Content-Type', 'application/xml');
		return $response;
	}
}
