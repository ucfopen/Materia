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
		Css::push_group('core');
	}

	private function setup_header()
	{
		// render the defined template
		$me = Model_User::find_current();
		$this->theme->set_partial('header', 'partials/header')->set('me', $me);

		// add google analytics
		if ($gid = Config::get('materia.google_tracking_id', false))
		{
			Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			$this->setup_header();
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
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		$this->theme->get_template()
			->set('title', 'Welcome to Materia')
			->set('page_type', 'store');

		$this->theme->set_partial('content', 'partials/homepage');
		Js::push_group('jquery_ui');
		Css::push_group('homepage');
	}

	public function action_permission_denied()
	{
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/nopermission');
	}

	public function action_help()
	{
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		$this->theme->get_template()
			->set('title', 'Help')
			->set('page_type', 'docs help');

		$this->theme->set_partial('content', 'partials/help/main');

		Css::push_group('help');
		Js::push('cdnjs::swfobject/2.2/swfobject.min.js'); // add swf object for flash testing
	}

	public function action_403()
	{
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		Css::push_group('404');

		$this->theme->get_template()
			->set('title', '403 Not Authorized')
			->set('page_type', '404');

		$this->theme->set_partial('content', 'partials/404');

		Log::warning('403 URL: '.Uri::main());

		$this->setup_header();

		$response = \Response::forge(\Theme::instance()->render(), 404);

		return $response;
	}

	/**
	 * Show 404 page
	 */
	public function action_404()
	{
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		Css::push_group('404');

		$this->theme->get_template()
			->set('title', '404 Page not Found')
			->set('page_type', '404');

		$this->theme->set_partial('content', 'partials/404');

		Log::warning('404 URL: '.Uri::main());

		$this->setup_header();

		$response = \Response::forge(\Theme::instance()->render(), 404);

		return $response;
	}

	/**
	 * Show 500 page
	 */
	public function action_500()
	{
		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		Css::push_group('500');

		$this->theme->get_template()
			->set('title', '500 Server Error')
			->set('page_type', '500');

		$this->theme->set_partial('content', 'partials/500');

		Log::warning('500 URL: '.Uri::main());

		$this->setup_header();

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
