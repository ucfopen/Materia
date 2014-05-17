<?
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets_Sandbox extends Controller_Widgets
{
	public function before() 
	{
		parent::before();
		if (\Fuel::$env != \Fuel::DEVELOPMENT) throw new HttpNotFoundException;
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$me = Model_User::find_current();
			if ($me)
			{
				// add beardmode
				if (isset($me->profile_fields['beardmode']) && $me->profile_fields['beardmode'] == 'on')
				{
					Casset::js_inline('var BEARD_MODE = true;');
					Casset::js_inline('var beards = ["black_chops", "dusty_full", "grey_gandalf", "red_soul"];');
					Casset::css('beard_mode.css', false, 'page');
				}
			}

			$this->theme->set_partial('header', $this->_header)->set('me', $me);

			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Casset::js_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			Casset::js_inline('var BASE_URL = "'.Uri::base().'";');
			Casset::js_inline('var WIDGET_URL = "'.Config::get('materia.urls.static').'widget/sandbox/";');
			Casset::js_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');
			$response = Response::forge(Theme::instance()->render());
		}

		return parent::after($response);
	}

	public function action_detail()
	{
		$widget = json_encode($this->_create_development_widget($this->param('clean_name')));

		if ( ! $widget) throw new HttpNotFoundException;

		Package::load('casset');
		Casset::js_inline('var widget_info = ['.$widget.'];');
		// This line overrides the Coms class with the development Coms class.
		// (So we can develop with custom Coms to not touch the database)
		Casset::js('static::materia.coms.sandbox.js', 'widget_detail');
		Casset::enable_js(['widget_detail']);
		Casset::enable_css(['widget_detail']);

		$this->theme->get_template()
			->set('title', 'Widget Details')
			->set('page_type', 'widget');

		$this->theme->set_partial('content', 'partials/widget/detail');
	}

	public function action_play_demo()
	{
		$widget = $this->_create_development_widget($this->param('clean_name'));

		if ( ! $widget) throw new HttpNotFoundException;
		if (is_file(\Config::get('materia.dirs.static').'widget/sandbox/'.$this->param('clean_name').'/demo.yaml') ) $this->action_play_widget($this->param('clean_name'), true);
		else throw new HttpNotFoundException;
	}

	public function action_play_widget($inst_id, $demo=false, $embed=false, $play_id=false)
	{
		$clean_name = $this->param('clean_name');
		$inst = $this->_create_development_widget_instance($clean_name);
		$demo = $this->_load_demo_instance($clean_name);
		$qset = json_encode($demo['qset']);
		$inst->name = $demo['name'];

		Package::load('casset');
		Casset::js('static::materia.coms.sandbox.js', 'widget_play');
		Casset::js_inline('var demo_qset = '.$qset);
		Casset::js_inline('var widget_inst = '.json_encode($inst));

		$this->_display_widget($inst, $embed);
	}

	public function action_create()
	{
		$widget = $this->_create_development_widget($this->param('clean_name'));

		if ( ! $widget) throw new HttpNotFoundException;

		$widget->id = str_replace('develop/', '', $widget->id);
		$widget->dir = $this->param('clean_name').'/';
		$widget->player = 'widget.html';
		Package::load('casset');
		Casset::js('static::materia.coms.sandbox.js', 'widget_editor');
		Casset::js_inline('var widget_info = ['.json_encode($widget).'];');

		$this->_show_editor('Create Widget', (object)$widget);
	}

	public function action_dump()
	{		
		// load the demo yaml, setup the qset as needed
		$demo_file = \Config::get('materia.dirs.static').'widget/sandbox/'.$this->param('clean_name').'/demo.yaml';
		$demo_text = \File::read($demo_file, true);
		$demo_text = \Format::forge($demo_text, 'yaml')->to_array();
		$demo_text = ['version' => $demo_text['qset']['version'], 'data' => $demo_text['qset']['data']];
		$demo_text = json_encode($demo_text);
		Package::load('casset');
		return Response::forge($demo_text);
	}

	private function _create_development_widget($clean_name)
	{
		// load the demo yaml, setup the qset as needed
		$install_file = \Config::get('materia.dirs.static').'widget/sandbox/'.$clean_name.'/install.yaml';
		$install      = \File::read($install_file, true);
		$widget_data  = \Format::forge($install, 'yaml')->to_array();

		// build an assoc array to forge a new widget object
		$widget               = array_merge($widget_data['files'], $widget_data['general'], $widget_data['score']);
		$widget['meta_data']  = $widget_data['meta_data'];
		$widget['creator']    = $widget['creator'];
		$widget['created_at'] = time();
		$widget['dir']        = $widget['name'].'/';

		// flash_version must be cast as a string, or swfobject will crash
		$widget['flash_version'] = (string)$widget['flash_version'];

		$widget = new \Materia\Widget($widget);
		$widget->dir = $clean_name.'/';
		return $widget;
	}

	private function _create_development_widget_instance($clean_name)
	{
		$instance                = new \Materia\Widget_Instance();
		$instance->widget        = $this->_create_development_widget($clean_name);
		
		$instance->clean_name    = \Inflector::friendly_title($instance->widget->name, '-', true);
		$instance->id            = $instance->clean_name;
		$instance->created_at    = time();
		$instance->widget->dir   = $instance->clean_name.'/';
		$instance->dir           = $instance->clean_name.'/';
		$instance->attempts      = -1;
		$instance->close_at      = -1;
		$instance->is_draft      = false;
		$instance->open_at       = -1;
		$instance->qset          = ['version' => null, 'data' => null];
		$instance->user_id       = 1;

		return $instance;
	}

	private function _load_demo_instance($clean_name)
	{
		$demo_file = \Config::get('materia.dirs.static').'widget/sandbox/'.$clean_name.'/demo.yaml';
		$demo_text = \File::read($demo_file, true);
		$demo_text = \Format::forge($demo_text, 'yaml')->to_array();
		$demo_text['qset']['data'] = json_decode(json_encode($demo_text['qset']['data']), true);
		\Materia\Widget_Instance::find_questions($demo_text['qset']['data'], true);
		return $demo_text;
	}

}
