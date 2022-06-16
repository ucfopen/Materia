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
		$cfg = \Config::get('lti::lti.consumers.default');
		// TODO: this is hard coded for Canvas, figure out if the request carries any info we can use to figure this out
		$this->theme->set_template('partials/config_xml');
		$this->theme->get_template()
			->set('title', $cfg['title'])
			->set('description', $cfg['description'])
			->set('launch_url', \Uri::create('lti/assignment'))
			->set('login_url', \Uri::create('lti/login'))
			->set('picker_url', \Uri::create('lti/picker'))
			->set('platform', $cfg['platform'])
			->set('privacy_level', $cfg['privacy'])
			->set('course_nav_enabled', $cfg['course_nav_enabled'] ?? true)
			->set('course_nav_default', $cfg['course_nav_default'] ?? true)
			->set('course_nav_text', $cfg['course_nav_text'] ?? true)
			->set('course_nav_visibility', $cfg['course_nav_visibility'] ?? true)
			->set('tool_id', $cfg['tool_id'] ?? true);

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
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

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
	public function action_success(string $inst_id)
	{
		$inst = \Materia\Widget_Instance_Manager::get($inst_id);

		// If the current user does not have ownership over the embedded widget, find all of the users who do
		$current_user_owns = \Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, \Materia\Perm::INSTANCE, [\Materia\Perm::VISIBLE, \Materia\Perm::FULL]);
		$instance_owner_list = $current_user_owns ? [] : $inst->get_owners();

		$this->theme->set_template('layouts/main')
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		$this->theme->set_partial('content', 'partials/open_preview')
			->set('inst_name', $inst->name)
			->set('widget_name', $inst->widget->name)
			->set('preview_url', \Uri::create('/preview/'.$inst_id))
			->set('icon', \Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png")
			->set('preview_embed_url', \Uri::create('/preview-embed/'.$inst_id))
			->set('current_user_owns', $current_user_owns)
			->set('instance_owner_list', $instance_owner_list);

		$this->insert_analytics();

		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var inst_id = "'.$inst_id.'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');

		\Css::push_group(['core', 'lti']);

		return \Response::forge($this->theme->render());
	}

}
