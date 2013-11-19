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

		switch (Api::get_role())
		{
			case 'Administrator':
			case 'Instructor':
				$inst_id = \Input::get('widget');
				if ( ! \RocketDuck\Util_Validator::is_valid_hash($inst_id))
				{
					return $this->action_error('Unknown Assignment');
				}
				return \Request::forge('lti/preview/'.$inst_id, true)->execute();

			case 'Learner':
			case 'Student':
				$inst_id = \Input::get('widget');

				$play = Api::init_assessment_session($inst_id);

				if ( ! $play || ! isset($play->inst_id))
				{
					return $this->action_error('Unknown Assignment');
				}
				else
				{
					return \Request::forge('embed/'.$play->inst_id, true)->execute([$play->play_id]);
				}
		}

		return $this->action_error('Unknown Role');
	}

	public function action_preview($inst_id)
	{
		if ( ! Api::authenticate()) return $this->action_error('Unknown User');

		if ( ! $inst_id) return $this->action_error('Unknown Assignment');

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/main')
			->set('title', 'Widget Connected Successfully')
			->set('page_type', 'preview');

		\Package::load('casset');
		\Casset::add_group('css', 'lti_picker', ['lti.css']);

		$this->theme->get_template();

		$this->theme->set_partial('content', 'partials/open_preview')
			->set('preview_url', \Uri::create('/preview/'.$inst_id));

		//$this->theme->set_partial('header', 'partials/header_empty');

		// add google analytics
		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Casset::js_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

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

		\Package::load('casset');
		\Casset::add_group('js', 'lti_picker',
			[
				'swfobject.js',
				'plugins/spin.js',
				'plugins/spin.jquery.js',
				'plugins/jquery.qtip-1.0.0-rc3.min.js',
				'jquery-ui-1.10.3.custom.min.js',
				'static::materia.set.throbber.js',
				'static::materia.image.js',
				'static::materia.coms.json.js',
				'static::materia.textfilter.js',
				'static::materia.widget.js',
				'static::materia.widgetinstance.js',
				'static::materia.set.availability.js',
				'static::materia.set.datetime.js',
				'materia.page.lti.js'
		]);
		\Casset::add_group('css', 'lti_picker', ['lti.css']);
		\Casset::js_inline('var BASE_URL = "'.\Uri::base().'";');
		\Casset::js_inline('var WIDGET_URL = "'.\Config::get('materia.urls.engines').'";');
		\Casset::js_inline('var STATIC_URL = "'.\Config::get('materia.urls.static').'";');
		\Casset::js_inline($this->theme->view('partials/select_item_js')
			->set('system', $system));

		if ($is_selector_mode && ! empty($return_url))
		{
			\Casset::js_inline('var RETURN_URL = "'.$return_url.'"');
		}

		$this->theme->get_template()
			->set('title', 'Select a Widget for Use in '.$system)
			->set('page_type', 'lti-select');

		$this->theme->set_partial('content', 'partials/select_item');
		$this->theme->set_partial('header', 'partials/header_empty');

		// add google analytics
		if ($gid = \Config::get('materia.google_tracking_id', false))
		{
			\Casset::js_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

		return \Response::forge(\Theme::instance()->render());
	}

	/**
	 * 	Errors for embedded pages
	 */
	public function action_error($msg)
	{
		$source_id   = \Input::post('lis_result_sourcedid', false); // the unique id for this course&context&user&launch used for returning scores
		$service_url = \Input::post('lis_outcome_service_url', false); // where to send score data back to, can be blank if not supported
		$resource_id = \Input::post('resource_link_id', false); // unique placement of this tool in the consumer
		$consumer_id = \Input::post('tool_consumer_instance_guid', false); // unique install id of this tool
		$consumer    = \Input::post('tool_consumer_info_product_family_code', 'this system');
		$inst_id     = \Input::post('custom_widget_instance_id', false); // Some tools will pass which inst_id they want
		\RocketDuck\Log::profile(['action-error', \Model_User::find_current_id(), $msg, Api::get_role(), $source_id, $resource_id, $consumer_id, $consumer, $inst_id], 'lti');
		\RocketDuck\Log::profile([print_r($_POST, true)], 'lti-error-dump');

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/main');

		\Package::load('casset');
		\Casset::css('lti.css');
		\Casset::js_inline('var BASE_URL = "'.\Uri::base().'";');

		$this->theme->get_template()
			->set('title', 'Error - '.$msg)
			->set('page_type', 'lti-error');

		switch ($msg)
		{
			case 'Unknown User':
				$this->theme->set_partial('content', 'partials/no_user')
					->set('system', $consumer)
					->set('title', 'Error - '.$msg);
				break;

			case 'Unknown Assignment':
				$this->theme->set_partial('content', 'partials/no_assignment')
					->set('system', $consumer)
					->set('title', 'Error - '.$msg);
				break;

			case 'Unknown Role':
				$this->theme->set_partial('content', 'partials/no_role')
					->set('system', $consumer)
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
			\Casset::js_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
		}

		return \Response::forge(\Theme::instance()->render());
	}

}