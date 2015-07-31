<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Lti extends \Controller
{

	public function before()
	{
		$this->theme = \Theme::instance();
	}

	/**
	 * returns the LTI configuration xml
	 */
	public function action_index()
	{
		// TODO: this is hard coded for Canvas, figure out if the request carries any info we can use to figure this out
		$this->theme->set_template('partials/config_xml');
		$this->theme->get_template()
			->set('title', \Config::get('lti::lti.consumers.canvas.title'))
			->set('description', \Config::get('lti::lti.consumers.canvas.description'))
			->set('launch_url', \Uri::create('lti/assignment'))
			->set('picker_url', \Uri::create('lti/picker'))
			->set('platform', \Config::get('lti::lti.consumers.canvas.platform'))
			->set('privacy_level', \Config::get('lti::lti.consumers.canvas.privacy'));

		return \Response::forge($this->theme->render())->set_header('Content-Type', 'application/xml');
	}

	/**
	 * Instructor LTI view for choosing a widget
	 *
	 */
	public function action_picker($authenticate = true)
	{
		if ( ! Oauth::validate_post()) return $this->action_error('Invalid OAuth Request');

		$launch = Lti::get_launch_from_request();
		if ($authenticate && ! LtiUserManager::authenticate($launch)) return $this->action_error('Unknown User');

		$system           = ucfirst(\Input::post('tool_consumer_info_product_family_code', 'this system'));
		$is_selector_mode = \Input::post('selection_directive') == 'select_link';
		$return_url       = \Input::post('launch_presentation_return_url');

		\RocketDuck\Log::profile(['action_picker', \Input::post('selection_directive'), $system, $is_selector_mode ? 'yes':'no', $return_url], 'lti');

		$this->theme->set_template('layouts/main');

		\Js::push_group(['angular', 'ng_modal', 'jquery', 'jquery_ui', 'materia', 'author', 'lti_picker', 'spinner']);
		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var WIDGET_URL = "'.\Config::get('materia.urls.engines').'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static_crossdomain').'";');
		\Js::push_inline($this->theme->view('partials/select_item_js')
			->set('system', $system));
		\Css::push_group('lti');

		if ($is_selector_mode && ! empty($return_url))
		{
			\Js::push_inline('var RETURN_URL = "'.$return_url.'"');
		}

		$this->theme->get_template()
			->set('title', 'Select a Widget for Use in '.$system)
			->set('page_type', 'lti-select');

		$this->theme->set_partial('content', 'partials/select_item');
		$this->theme->set_partial('header', 'partials/header_empty');
		$this->insert_analytics();

		return \Response::forge($this->theme->render());
	}

	public function action_success($inst_id)
	{
		$launch = Lti::get_launch_from_request();
		if ( ! LtiUserManager::authenticate($launch)) return $this->action_error('Unknown User');
		if ( ! LtiUserManager::is_lti_user_a_content_creator($launch)) return $this->action_error('Unauthorized');

		return $this->_authenticated_preview($inst_id);
	}

	/**
	 * 	Errors for embedded pages
	 */
	public function action_error($msg)
	{
		$launch = Lti::get_launch_from_request();

		\RocketDuck\Log::profile(['action-error', \Model_User::find_current_id(), $msg, print_r($launch, true)], 'lti');
		\RocketDuck\Log::profile([print_r($_POST, true)], 'lti-error-dump');

		$this->theme->set_template('layouts/main');

		$this->theme->get_template()
			->set('title', 'Error - '.$msg)
			->set('page_type', 'lti-error');

		switch ($msg)
		{
			case 'Unknown User':
				$this->theme->set_partial('content', 'partials/no_user')
					->set('system', $launch->consumer)
					->set('title', 'Error - '.$msg);
				break;

			case 'Unknown Assignment':
				$this->theme->set_partial('content', 'partials/no_assignment')
					->set('system', $launch->consumer)
					->set('title', 'Error - '.$msg);
				break;

			default:
				$this->theme->set_partial('content', 'partials/unknown_error')
					->set('title', 'Error - '.$msg);
				break;
		}

		$this->theme->set_partial('header', 'partials/header_empty');
		$this->insert_analytics();
		\Js::push_group('core');
		\Css::push_group('lti');

		return \Response::forge($this->theme->render());
	}

	// expects that the user is all ready authenticated
	protected function _authenticated_preview($inst_id)
	{
		$this->theme->set_template('layouts/main')
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		$this->theme->set_partial('content', 'partials/open_preview')
			->set('preview_url', \Uri::create('/preview/'.$inst_id));

		$this->insert_analytics();

		\Css::push_group('lti');

		return \Response::forge($this->theme->render());
	}

	protected function insert_analytics()
	{
		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}
	}
}
