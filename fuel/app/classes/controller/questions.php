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

		Package::load('casset');
		Casset::enable_js(['question_catalog']);
		Casset::enable_css(['question_catalog']);

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');

		$this->theme->get_template()
			->set('title', 'Question Catalog')
			->set('page_type', 'import');

		$this->theme->set_partial('content', 'partials/catalog/question');

		Casset::js_inline('var BASE_URL = "'.Uri::base().'";');
		Casset::js_inline('Materia.QuestionImporter.init(API_LINK);');
		return Response::forge(Theme::instance()->render());
	}
}
