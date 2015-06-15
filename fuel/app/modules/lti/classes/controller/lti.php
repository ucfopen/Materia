<?php
/**
 * Materia
 * License outlined in licenses folder
 */

namespace Lti;

class Controller_Lti extends \Controller
{

	/**
	 * returns the LTI configuration xml
	 */
	public function action_index()
	{
		// TODO: this is hard coded for Canvas, figure out if the request carries any info we can use to figure this out
		$this->theme = \Theme::instance();
		$this->theme->set_template('partials/config_xml');
		$this->theme->get_template()
			->set('title', \Config::get('lti::lti.consumers.canvas.title'))
			->set('description', \Config::get('lti::lti.consumers.canvas.description'))
			->set('launch_url', \Uri::create('lti/assignment'))
			->set('picker_url', \Uri::create('lti/picker'))
			->set('platform', \Config::get('lti::lti.consumers.canvas.platform'))
			->set('privacy_level', \Config::get('lti::lti.consumers.canvas.privacy'));

		return \Response::forge(\Theme::instance()->render())->set_header('Content-Type', 'application/xml');
	}

	/**
	 * LTI Outcomes Gateway - LTI Post prams sent when Materia is used as an LTI assignment
	 */
	public function action_assignment()
	{
		if ( ! Api::authenticate()) return $this->action_error('Unknown User');

		if ( ! $inst_id = Api::resolve_inst_id()) return $this->action_error('Unknown Assignment');

		if (Api::can_create()) return $this->_authenticated_preview($inst_id);

		$play = Api::init_assessment_session($inst_id);

		if ( ! $play || ! isset($play->inst_id)) return $this->action_error('Session Starting Error');

		return \Request::forge("embed/{$play->inst_id}", true)->execute([$play->play_id]);
	}

	// expects that the user is all ready authenticated
	protected function _authenticated_preview($inst_id)
	{
		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/main')
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		$this->theme->get_template();

		$this->theme->set_partial('content', 'partials/open_preview')
			->set('preview_url', \Uri::create('/preview/'.$inst_id));

		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

		\Css::push_group('lti');

		return \Response::forge(\Theme::instance()->render());
	}

	/**
	 * Instructor LTI view for choosing a widget
	 *
	 */
	public function action_picker($authenticate = true)
	{
		if ($authenticate && ! Api::authenticate()) return $this->action_error('Unknown User');

		$system           = ucfirst(\Input::post('tool_consumer_info_product_family_code', 'this system'));
		$is_selector_mode = \Input::post('selection_directive') == 'select_link';
		$return_url       = \Input::post('launch_presentation_return_url');

		\RocketDuck\Log::profile(['action_picker', \Input::post('selection_directive'), $system, $is_selector_mode ? 'yes':'no', $return_url], 'lti');

		$this->theme = \Theme::instance();
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

		// add google analytics
		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

		return \Response::forge(\Theme::instance()->render());
	}

	/**
	 * 	Errors for embedded pages
	 */
	public function action_error($msg)
	{
		$launch = Api::get_launch_vars();

		\RocketDuck\Log::profile(['action-error', \Model_User::find_current_id(), $msg, print_r($launch, true)], 'lti');
		\RocketDuck\Log::profile([print_r($_POST, true)], 'lti-error-dump');

		$this->theme = \Theme::instance();
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

		// add google analytics
		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}
		\Js::push_group('core');
		\Css::push_group('lti');

		return \Response::forge(\Theme::instance()->render());
	}

}
