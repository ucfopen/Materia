<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Lti extends \Controller
{
	use \Trait_CommonControllerTemplate;

	// overrides Trait_CommonControllerTemplate->before()
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
		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error/invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ( ! LtiUserManager::authenticate($launch)) \Response::redirect('/lti/error/invalid_oauth_request');

		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Materia')
			->set('page_type', 'lti-login');

		\Js::push_group(['react', 'post_login']);

		return \Response::forge($this->theme->render());
	}

	/**
	 * Instructor LTI view for choosing a widget
	 *
	 */
	public function action_picker(bool $authenticate = true)
	{
		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error/invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ($authenticate && ! LtiUserManager::authenticate($launch)) return \Response::redirect('/lti/error/unknown_user');

		$system           = ucfirst(\Input::post('tool_consumer_info_product_family_code', 'this system'));
		$is_selector_mode = \Input::post('selection_directive') === 'select_link' || \Input::post('lti_message_type') === 'ContentItemSelectionRequest';
		$return_url       = \Input::post('launch_presentation_return_url') ?? \Input::post('content_item_return_url');

		\Materia\Log::profile(['action_picker', \Input::post('selection_directive'), $system, $is_selector_mode ? 'yes' : 'no', $return_url], 'lti');

		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var WIDGET_URL = "'.\Config::get('materia.urls.engines').'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');
		\Js::push_inline('var SYSTEM = "'.$system.'";');
		\Css::push_group(['core', 'lti']);

		if ($is_selector_mode && ! empty($return_url))
		{
			\Js::push_inline('var RETURN_URL = "'.$return_url.'"');
		}

		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Select a Widget for Use in '.$system)
			->set('page_type', 'lti-select');

		\Js::push_group(['react', 'select_item']);

		return \Response::forge($this->theme->render());
	}

	// Successfully linked LTI page
	public function action_success(string $inst_id)
	{
		$inst = \Materia\Widget_Instance_Manager::get($inst_id);

		// If the current user does not have ownership over the embedded widget, find all of the users who do
		$current_user_owns = \Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, \Materia\Perm::INSTANCE, [\Materia\Perm::VISIBLE, \Materia\Perm::FULL]);

		$instance_owner_list = $current_user_owns ? [] : (array_map(function ($object)
		{
			return (object) [
				'first' 	=> $object->first,
				'last' 		=> $object->last,
				'id' 		=> $object->id
			];
		}, $inst->get_owners()));

		\Js::push_inline('var BASE_URL = "'.\Uri::base().'";');
		\Js::push_inline('var PREVIEW_URL = "'.\Uri::create('/preview/'.$inst_id).'";');
		\Js::push_inline('var ICON_URL = "'.\Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png".'";');
		\Js::push_inline('var PREVIEW_EMBED_URL = "'.\Uri::create('/preview-embed/'.$inst_id).'";');
		\Js::push_inline('var CURRENT_USER_OWNS = "'.$current_user_owns.'";');
		\Js::push_inline('var STATIC_CROSSDOMAIN = "'.\Config::get('materia.urls.static').'";');
		\Js::push_inline('var OWNER_LIST = '.json_encode($instance_owner_list).';');
		\Js::push_inline('var USER_ID = "'.\Model_User::find_current_id().'";');

		\Css::push_group(['core', 'lti']);

		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		\Js::push_group(['react', 'open_preview']);

		return \Response::forge($this->theme->render());
	}

}
