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

		return Response::forge(Theme::instance()->render());
	}
}
