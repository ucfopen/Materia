<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Scores extends Controller
{

	protected $_header = 'partials/header';

	public function before()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$this->theme->set_partial('header', $this->_header)->set('me', Model_User::find_current());
			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			Js::push_inline('var BASE_URL = "'.Uri::base().'";');
			Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
			Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

			$response = Response::forge(Theme::instance()->render());
		}


		return parent::after($response);
	}

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
		if (\Model_User::verify_session() !== true)
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'embed_scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		$token = \Input::get('token', false);
		if ($token)
		{
			Js::push_inline('var LAUNCH_TOKEN = "'.$token.'";');
		}

		$this->_header = 'partials/header_empty';
		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}
}
