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

		Css::push_group(['core', 'qset_history']);
		Js::push_group(['react', 'qset_history']);

		return Response::forge($theme->render());
	}

	public function action_confirm()
	{
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;

		Css::push_group(['core', 'rollback_dialog']);
		Js::push_group(['angular', 'jquery', 'materia', 'author']);

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		$theme = Theme::instance();
		$theme->set_template('layouts/main');
		$theme->get_template()
			->set('title', 'Confirm Qset Import')
			->set('page_type', 'confirm');

		$theme->set_partial('footer', 'partials/angular_alert');
		$theme->set_partial('content', 'partials/widget/rollback_confirm');

		return Response::forge($theme->render());

	}
}
