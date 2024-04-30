<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Qsets extends Controller
{

	public function action_import()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;

		$theme = Theme::instance();
		$theme->set_template('layouts/react');
		$theme->get_template()
			->set('title', 'QSet Catalog')
			->set('page_type', 'import');

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		Css::push_group(['qset_history']);
		Js::push_group(['react', 'qset_history']);

		return Response::forge($theme->render());
	}

	public function action_generate()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;

		$theme = Theme::instance();
		$theme->set_template('layouts/react');
		$theme->get_template()
			->set('title', 'QSet Generation')
			->set('page_type', 'generate');

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		Css::push_group(['qset_generation']);
		Js::push_group(['react', 'qset_generator']);

		return Response::forge($theme->render());
	}
}
