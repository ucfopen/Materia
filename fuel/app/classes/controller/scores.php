<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Scores extends Controller
{

	protected $_header = 'partials/header';

	public function before()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$this->theme->set_partial('header', $this->_header)->set('me', Model_User::find_current());
			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			Js::push_inline('var BASE_URL = "'.Uri::base().'";');
			Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
			Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

			$response = Response::forge(Theme::instance()->render());
		}


		return parent::after($response);
	}

	public function get_show($inst_id)
	{
		$instances = Materia\Api::widget_instances_get([$inst_id]);
		if ( ! count($instances)) throw new HttpNotFoundException;

		$inst = $instances[0];
		// not allowed to play the widget
		if (! $inst->playable_by_current_user())
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student', 'labjs']);

		$lti_token = \Input::get('ltitoken', false);
		if ($lti_token)
		{
			Js::push_inline('var __LTI_TOKEN = "'.$lti_token.'";');
		}

		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}

	public function get_show_embedded($inst_id)
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'embed_scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		$lti_token = \Input::get('ltitoken', false);
		if ($lti_token)
		{
			Js::push_inline('var __LTI_TOKEN = "'.$lti_token.'";');
		}

		$this->_header = 'partials/header_empty';
		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}

	public function get_export($format, $inst_id, $semesters_string){
		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login'));
		}

		$inst = Materia\Widget_Instance_Manager::get($inst_id);

		// pass in inst name

		if ( ! Materia\Perm_Manager::user_has_any_perm_to(\Auth::instance()->get_user_id()[1], $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::VISIBLE, Materia\Perm::FULL]) && ! \Model_User::verify_session(\RocketDuck\Perm_Role::SU))
		{
			return new Response('', 403);
		}

		//attaches $inst to instantiated objects own property
		$export_module = \Materia\Score_Manager::get_export_module_for_widget($inst_id);

		if (method_exists($export_module, $format))
		{
			try
			{
				list($data, $filetype) = $export_module->$format($semesters_string);
				return $this->build_download_response($data, $inst->name.$filetype);
			}
			catch (\Exception $e)
			{
				trace("Error building export file: ".$e);
				throw new HttpServerErrorException;
			}
		}

		trace("Could not find request export method among methods available in export module");
		throw new HttpNotFoundException;
	}

	public function get_storage($inst_id, $table_name, $semesters)
	{
		$table_name = html_entity_decode($table_name);
		$csv        = \Materia\Storage_Manager::get_csv_logs_by_inst_id($inst_id, $table_name, explode(',', $semesters));
		$inst       = \Materia\Widget_Instance_Manager::get($inst_id);

		return $this->build_download_response($csv, "$table_name [$inst->name].csv");
	}

	private function build_download_response($data, $filename)
	{
		return Response::forge()
			->body($data)
			->set_header('Pragma', 'public')
			->set_header('Expires', '0')
			->set_header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
			->set_header('Content-Type', 'application/force-download')
			->set_header('Content-Type', 'application/octet-stream')
			->set_header('Content-Type', 'application/download')
			->set_header('Content-Disposition', "attachment; filename=\"$filename\"");
	}
}
