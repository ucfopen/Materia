<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Error extends \Controller
{
	protected $_content_partial = 'partials/error_general';
	protected $_message = 'There was a problem';

	public function after($response)
	{
		$msg    = str_replace('_', ' ', \Input::param('message', $this->_message));
		$system = str_replace('_', ' ', \Input::param('system', 'the system'));

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/main');
		$this->theme->set_partial('header', 'partials/header_empty');
		$this->theme->get_template()
			->set('title', 'Error - '.$msg)
			->set('page_type', 'lti-error');

		$this->theme->set_partial('content', $this->_content_partial )
			->set('title', "Error - {$msg}")
			->set('system', $system);

		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Js::push_inline($this->theme->view('partials/google_analytics', ['id' => $gid]));
		}

		\Js::push_group(['angular', 'materia']);
		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

		\Css::push_group('lti');

		return \Response::forge(\Theme::instance()->render());
	}

	public function action_unknown_user()
	{
		$this->_content_partial = 'partials/error_unknown_user';
		$this->_message = 'Unknown User';
	}

	public function action_unknown_assignment()
	{
		$this->_content_partial = 'partials/error_unknown_assignment';
		$this->_message = 'Unknown Assignment';
	}

	public function action_autoplay_misconfigured()
	{
		$this->_content_partial = 'partials/error_autoplay_misconfigured';
		$this->_message = 'Widget Misconfigured';
	}

	public function action_guest_mode()
	{
		$this->_content_partial = 'partials/error_lti_guest_mode';
		$this->_message = 'Assignment has guest mode enabled';
	}

	public function action_index()
	{

	}
}
