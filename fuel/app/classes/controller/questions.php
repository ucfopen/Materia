<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Questions extends Controller
{
	public function get_import()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Question Catalog')
			->set('page_type', 'import');

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		Css::push_group(['core', 'questionimport']);
		Js::push_group(['react', 'question-importer']);

		return Response::forge($this->theme->render());
	}
}
