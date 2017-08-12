<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Scores extends Controller
{
	use Trait_CommonControllerTemplateTrait;

	public function get_show($inst_id)
	{
		$instances = Materia\Api::widget_instances_get([$inst_id]);
		if ( ! count($instances)) throw new HttpNotFoundException;

		$inst = $instances[0];
		// not allowed to play the widget
		if ( ! $inst->playable_by_current_user())
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student', 'labjs']);

		$token = \Input::get('token', false);
		if ($token)
		{
			Js::push_inline('var LAUNCH_TOKEN = "'.$token.'";');
		}

		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}

	public function get_show_embedded($inst_id)
	{
		$this->_header = 'partials/header_empty';
		$this->get_show($inst_id);
	}
}
