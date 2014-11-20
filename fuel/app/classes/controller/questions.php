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
		if (Materia\Api::session_valid() !== true ) throw new HttpNotFoundException;

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');

		$this->theme->get_template()
			->set('title', 'Question Catalog')
			->set('page_type', 'import');

		$this->theme->set_partial('content', 'partials/catalog/question');

		Css::push_group("core");
		Css::push_group("question_catalog");
		Js::push_group("core");
		Js::push_group("dataTables");
		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

		return Response::forge(Theme::instance()->render());
	}
}
