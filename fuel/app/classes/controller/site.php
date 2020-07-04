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
		Js::push_group(['angular', 'materia']);

		$this->theme->get_template()
			->set('title', 'Welcome to Materia')
			->set('page_type', 'store');

		$spotlight = $this->theme->view('partials/spotlight');
		$this->theme->set_partial('content', 'partials/homepage')
			->set_safe('spotlight', $spotlight);

	}

	public function action_permission_denied()
	{
		Js::push_group(['angular', 'materia']);

		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/nopermission');
	}

	public function action_help()
	{
		Js::push_group(['angular', 'materia']);

		$this->theme->get_template()
			->set('title', 'Help')
			->set('page_type', 'docs help');

		$this->theme->set_partial('content', 'partials/help/main');

		Css::push_group('help');
	}

	public function action_403()
	{
		Css::push_group('errors');

		$this->theme->get_template()
			->set('title', '403 Not Authorized')
			->set('page_type', '404');

		$this->theme->set_partial('content', 'partials/404');

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

		$this->theme->get_template()
			->set('title', '404 Page not Found')
			->set('page_type', '404');

		$this->theme->set_partial('content', 'partials/404');

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

		$this->theme->get_template()
			->set('title', '500 Server Error')
			->set('page_type', '500');

		$this->theme->set_partial('content', 'partials/500');

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
