<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Questions extends Controller
{

	public function action_import()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;


		Css::push_group(['core', 'question_import']);
		Js::push_group(['angular', 'jquery', 'materia', 'author', 'dataTables']);

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		$theme = Theme::instance();
		$theme->set_template('layouts/main');
		$theme->get_template()
			->set('title', 'Question Catalog')
			->set('page_type', 'import');

		$theme->set_partial('footer', 'partials/angular_alert');
		$theme->set_partial('content', 'partials/catalog/question');

		return Response::forge($theme->render());
	}
}
