<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Error extends \Controller
{
	use \Trait_CommonControllerTemplate;
	use \Trait_Supportinfo;

	// overrides Trait_CommonControllerTemplate->before()
	public function before()
	{
		$this->theme = \Theme::instance();
	}

	protected $_message = 'There was a problem';
	protected $_type = 'error_general';

	public function after($response)
	{
		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var TITLE = "'.'Error - '.$this->_message.'";');
		\Js::push_inline('var ERROR_TYPE = "'.$this->_type.'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

		$this->add_inline_info();

		\Css::push_group('lti');

		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Error - '.$this->_message)
			->set('page_type', 'lti-error');

		\Js::push_group(['react', 'error_general']);

		return \Response::forge(\Theme::instance()->render());
	}

	public function action_unknown_user()
	{
		$this->_type = 'error_unknown_user';
		$this->_message = 'Unknown User';
	}

	public function action_unknown_assignment()
	{
		$this->_message = 'Unknown Assignment';
		$this->_type = 'error_unknown_assignment';
	}

	public function action_invalid_oauth_request()
	{
		$this->_message = 'Invalid OAuth Request';
		$this->_type = 'error_invalid_oauth_request';
	}

	/**
	* This indicates that an instructor has tried to use a pre-embed placeholder play URL as an assignment URL
	* As this (currently) breaks other LTI functionality such as passbacks and context affiliations,
	*  the preference is to instead treat it as an error and inform any users as such
	*/
	public function action_autoplay_misconfigured()
	{
		$this->_message = 'Widget Misconfigured - Autoplay cannot be set to false for LTI assignment widgets';
		$this->_type = 'error_autoplay_misconfigured';
	}

	public function action_guest_mode()
	{
		$this->_message = 'Assignment has guest mode enabled';
		$this->_type = 'error_lti_guest_mode';
	}

	public function action_index()
	{

	}
}
