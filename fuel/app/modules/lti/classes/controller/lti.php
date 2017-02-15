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
			->set('button_url', \Uri::create('lti/button'))
			->set('platform', \Config::get('lti::lti.consumers.canvas.platform'))
			->set('privacy_level', \Config::get('lti::lti.consumers.canvas.privacy'));

		return \Response::forge($this->theme->render())->set_header('Content-Type', 'application/xml');
	}

// 	public function action_button()
// 	{
// 		$xml = '<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0" xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0" xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
// 	<blti:title>Create Materia Widget</blti:title>
// 	<blti:description>This tool adds a course navigation link to a page on a fish called "Wanda"</blti:description>
// 	<blti:extensions platform="canvas.instructure.com">
// 		<lticm:property name="tool_id">course_navigation</lticm:property>
// 		<lticm:property name="privacy_level">public</lticm:property>
// 		<lticm:options name="course_navigation">
// 			<lticm:property name="url">'.\Uri::create('lti/picker2').'</lticm:property>
// 			<lticm:property name="text">Create Materia Widget</lticm:property>
// 		</lticm:options>
// 	</blti:extensions>
// </cartridge_basiclti_link>';
// 		return \Response::forge($xml)->set_header('Content-Type', 'application/xml');
// 	}

	/**
	 * Instructor LTI view for choosing a widget
	 *
	 */
	public function action_picker($authenticate = true)
	{
		// return '<pre>'.print_r($_POST, true);
		// die();

		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error?message=invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ($authenticate && ! LtiUserManager::authenticate($launch)) return \Response::redirect('/lti/error/unknown_user');

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

	public function action_button($authenticate = true)
	{
		// return '<pre>'.print_r($_POST, true);
		// die();
		if ( ! Oauth::validate_post()) \Response::redirect('/lti/error?message=invalid_oauth_request');

		$launch = LtiLaunch::from_request();
		if ($authenticate && ! LtiUserManager::authenticate($launch)) return \Response::redirect('/lti/error/unknown_user');

		$system           = ucfirst(\Input::post('tool_consumer_info_product_family_code', 'this system'));
		$is_selector_mode = true;
		$return_url       = \Uri::create('lti/buttonreturn');

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

	public function action_buttonreturn()
	{
		$external_tool_url = $_GET['url'];

		$inst_id_str = substr($external_tool_url, strpos($external_tool_url, '/embed/') + 7);
		$inst_id = substr($inst_id_str, 0, strpos($inst_id_str, '/'));
		$inst = \Materia\Widget_Instance_Manager::get($inst_id);
		$assignment_name = $inst->name;
		// die();


		// $assignment_name = 'TODO';
		$canvas_url = $url = "http://192.168.99.100:3000/api/v1/courses/1/assignments";


		$curl = \Request::forge($canvas_url, 'curl');
		$curl->set_method('post');
		$curl->set_header("Authorization", "Bearer oM3JrNmjte175aaz9NaRi5UhAjXjM5321RR2omukyNwLjFkPtJjTv8LKIO8IKc8E");

		$curl->set_params([
			'assignment[name]' => $assignment_name,
			'assignment[submission_types][]' => 'external_tool',
			'assignment[external_tool_tag_attributes][url]' => $external_tool_url,
			'assignment[grading_type]' => 'percent',
			'assignment[points_possible]' => '10'
		]);

		$results = $curl->execute();

		$assignment_url = json_decode($results->response()->body)->html_url;

		// \Response::redirect($assignment_url.'/edit');

		$this->theme->set_template('layouts/main');

		$this->theme->get_template()
			->set('title', '@TODO');

		$this->theme->set_partial('content', 'partials/redirect_to_assignment');

		\Js::push_inline($this->theme->view('partials/redirect_to_assignment_js')
			->set('assignment_url', $assignment_url.'/edit'));

		$this->theme->set_partial('header', 'partials/header_empty');

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
