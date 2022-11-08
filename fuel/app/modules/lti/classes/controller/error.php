<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Error extends \Controller
{
	use \Trait_Analytics;
	protected $_content_partial = 'partials/error_general';
	protected $_message = 'There was a problem';

	public function after($response)
	{
		$msg    = str_replace('_', ' ', \Input::param('message', $this->_message));
		$system = str_replace('_', ' ', \Input::param('system', 'the system'));

		$this->theme = \Theme::instance();

		$this->insert_analytics();
		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var TITLE = "'.'Error - '.$msg.'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

		\Css::push_group('lti');

		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Error - '.$msg)
			->set('page_type', 'lti-error');

		\Js::push_group(['react', 'error_general']);

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

	/**
	* This indicates that an instructor has tried to use a pre-embed placeholder play URL as an assignment URL
	* As this (currently) breaks other LTI functionality such as passbacks and context affiliations,
	*  the preference is to instead treat it as an error and inform any users as such
	*/
	public function action_autoplay_misconfigured()
	{
		$this->_content_partial = 'partials/error_autoplay_misconfigured';
		$this->_message = 'Widget Misconfigured - Autoplay cannot be set to false for LTI assignment widgets';
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
