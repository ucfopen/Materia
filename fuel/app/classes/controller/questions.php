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
		if (\Model_User::verify_session() !== true ) throw new HttpNotFoundException;


		Css::push_group(['core', 'question_catalog']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'dataTables']);

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

		$theme = Theme::instance();
		$theme->set_template('layouts/main');
		$theme->get_template()
			->set('title', 'Question Catalog')
			->set('page_type', 'import');

		$theme->set_partial('content', 'partials/catalog/question');

		return Response::forge($theme->render());
	}
}
