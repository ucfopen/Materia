<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Lti extends \Controller
{
	use \Trait_Analytics;

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
			->set('login_url', \Uri::create('lti/login'))
			->set('picker_url', \Uri::create('lti/picker'))
			->set('platform', \Config::get('lti::lti.consumers.canvas.platform'))
			->set('privacy_level', \Config::get('lti::lti.consumers.canvas.privacy'))
			->set('course_nav_enabled', \Config::get('lti::lti.consumers.canvas.course_nav_enabled', true))
			->set('course_nav_default', \Config::get('lti::lti.consumers.canvas.course_nav_default', true))
			->set('course_nav_text', \Config::get('lti::lti.consumers.canvas.course_nav_text', true))
			->set('course_nav_visibility', \Config::get('lti::lti.consumers.canvas.course_nav_visibility', true))
			->set('tool_id', \Config::get('lti::lti.consumers.canvas.tool_id', true));

		return \Response::forge($this->theme->render())->set_header('Content-Type', 'application/xml');
	}

	/**
	 * LTI for logging into Materia through Canvas
	 *
	 */
	public function action_login()
	{
		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error?message=invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ( ! LtiUserManager::authenticate($launch)) \Response::redirect('/lti/error?message=invalid_oauth_request');

		$this->theme->set_template('layouts/main')
			->set('title', 'Materia')
			->set('page_type', 'lti-login');

		$this->theme->set_partial('content', 'partials/post_login');
		$this->insert_analytics();

		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static_crossdomain').'";');

		\Css::push_group('core');

		return \Response::forge($this->theme->render());
	}

	/**
	 * Instructor LTI view for choosing a widget
	 *
	 */
	public function action_picker(bool $authenticate = true)
	{
		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error?message=invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ($authenticate && ! LtiUserManager::authenticate($launch)) return \Response::redirect('/lti/error/unknown_user');

		$system           = ucfirst(\Input::post('tool_consumer_info_product_family_code', 'this system'));
		$is_selector_mode = \Input::post('selection_directive') === 'select_link' || \Input::post('lti_message_type') === 'ContentItemSelectionRequest';
		$return_url       = \Input::post('launch_presentation_return_url') ?? \Input::post('content_item_return_url');

		\Materia\Log::profile(['action_picker', \Input::post('selection_directive'), $system, $is_selector_mode ? 'yes' : 'no', $return_url], 'lti');

		$this->theme->set_template('layouts/main');

		\Js::push_group(['angular', 'materia', 'author']);
		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var WIDGET_URL = "'.\Config::get('materia.urls.engines').'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');
		\Js::push_inline($this->theme->view('partials/select_item_js')
			->set('system', $system));
		\Css::push_group(['core', 'lti']);

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

	// Successfully linked LTI page
	public function action_success($inst_id)
	{
		$this->theme->set_template('layouts/main')
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		$this->theme->set_partial('content', 'partials/open_preview')
			->set('preview_url', \Uri::create('/preview/'.$inst_id));

		$this->insert_analytics();

		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

		\Css::push_group(['core', 'lti']);

		return \Response::forge($this->theme->render());
	}

}
