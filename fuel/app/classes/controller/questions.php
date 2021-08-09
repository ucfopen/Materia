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

	// this exists as an alternative to the above for use with the React component
	// once that is confirmed and is ready for real use as a replacement for the current question importer,
	//  remove the above action and rename this one 'get_import', remove extra routes etc.
	public function get_import2()
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
