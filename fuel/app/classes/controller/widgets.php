<?
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets extends Controller
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
			Casset::js_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
			Casset::js_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

			$response = Response::forge(Theme::instance()->render());
		}

		return parent::after($response);
	}

	/**
	 * Catalog page to show all the available widgets
	 *
	 * @login Not required
	 */
	public function action_index()
	{
		Package::load('casset');
		Casset::enable_js(['widget_catalog']);
		Casset::enable_css(['widget_catalog']);

		$this->theme->get_template()
			->set('title', 'Widget Catalog')
			->set('page_type', 'catalog');

		$this->theme->set_partial('content', 'partials/widget/catalog');
	}

	/**
	 * Catalog page for an individual widget
	 *
	 * @param string The clean name of the widget to load
	 * @login Not Required
	 */
	public function action_detail()
	{
		$widget = DB::select()
			->from('widget')
			->where('id', $this->param('id'))
			->execute();

		if ( ! $widget) throw new HttpNotFoundException;

		Package::load('casset');
		Casset::enable_css(['widget_detail']);
		Casset::enable_js(['widget_detail']);

		$this->theme->get_template()
			->set('title', 'Widget Details')
			->set('page_type', 'widget');

		$this->theme->set_partial('content', 'partials/widget/detail');

	}

	/**
	 * Loads creator for the given widget
	 *
	 * @param string $widgetName The clean name of the widget to load
	 * @login Required
	 */
	public function action_create()
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to create this widget.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		if (Materia\Api::session_valid('basic_author') != true)
		{
			$this->no_permission();
			return;
		}

		$widget = DB::select()
			->from('widget')
			->where('id', $this->param('id'))
			->execute();

		if ($widget->count() < 1) throw new HttpNotFoundException;

		View::set_global('me', Model_User::find_current());

		$widget = new Materia\Widget();
		$widget->get($this->param('id'));
		$this->_show_editor('Create Widget', $widget);
	}

	/**
	 * Loads the creator for the given widget and the given inst_id
	 * @param $widgetName
	 * @param $inst_id
	 * @login required
	 */
	public function action_edit($inst_id)
	{
		if (empty($inst_id)) throw new HttpNotFoundException;

		if (Materia\Api::session_valid() !== true)
		{
			Session::set_flash('notice', 'Please log in to edit this widget.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		if ( ! Materia\Perm_Manager::check_user_perm_to_object(\Model_User::find_current_id(), $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::FULL]))
		{
			$this->no_permission();
			return;
		}

		$inst = new Materia\Widget_Instance();
		$inst->db_get($inst_id);
		$this->_show_editor('Edit Widget', $inst->widget, $inst_id);
	}

	protected function _show_editor($title, $widget, $inst_id=null)
	{
		Package::load('casset');
		Casset::enable_css(['widget_editor']);
		Casset::enable_js(['widget_editor']);

		$this->theme->get_template()
			->set('title', $title)
			->set('page_type', 'create');

		$this->theme->set_partial('content', 'partials/widget/create')
			->set('widget', $widget)
			->set('inst_id', $inst_id);
	}

	/**
	 * Listing of all the available widgets
	 *
	 * @login Required
	 */
	public function action_mywidgets()
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your widgets.');
			Response::redirect(Router::get('login'));
		}

		if (Materia\Api::session_valid('basic_author') != true) return $this->_mywidgets_student();

		Package::load('casset');
		Casset::enable_js(['my_widgets']);
		Casset::enable_css(['my_widgets']);

		$this->theme->get_template()
			->set('title', 'My Widgets')
			->set('page_type', 'my_widgets');

		$this->theme->set_partial('content', 'partials/my_widgets');

	}

	protected function _mywidgets_student()
	{
		Package::load('casset');
		$this->theme->get_template()
			->set('title', '')
			->set('page_type', 'my_widgets');

		$this->theme->set_partial('content', 'partials/my_widgets_students');
	}

	public function action_play_demo()
	{
		$widget = DB::select()
			->from('widget')
			->where('id', $this->param('id'))
			->execute();

		if ( ! $widget) throw new HttpNotFoundException;

		$widget = new Materia\Widget();
		$widget->get($this->param('id'));

		if (isset($widget->meta_data['demo']) ) $this->action_play_widget($widget->meta_data['demo'], true);
		else throw new HttpNotFoundException;
	}

	public function action_play_widget($inst_id, $demo=false, $embed=false, $play_id=false)
	{
		// not logged in
		if (Materia\Api::session_valid() !== true)
		{
			$this->_build_widget_login('Login to play this widget', $inst_id, $embed);
		}
		else
		{
			$instances = Materia\Api::widget_instances_get([$inst_id], $demo);
			if ( ! count($instances)) throw new HttpNotFoundException;


			$inst = $instances[0];
			$status = $this->_get_status($inst);

			if ( ! $status['open'])
			{
				// widget is closed
				$this->_build_widget_login('Widget Unavailable', $inst_id);
			}
			elseif ( ! $demo && $inst->is_draft)
			{
				$this->action_draft_not_playable();
			}
			elseif ( ! $demo && ! $inst->widget->is_playable)
			{
				$this->action_retired();
			}
			elseif ( ! $status['has_attempts'])
			{
				// user has exceeded attempt limit
				$this->action_no_attempts($inst);
			}
			else
			{
				// create the play
				if ( ! $play_id)
				{
					$play_id = \Materia\Api::session_play_create($inst_id);

					if ($play_id instanceof \RocketDuck\Msg)
					{
						\Log::warning('session_play_create failed!');
						throw new HttpServerErrorException;
					}
				}

				// Attempt to get an lti token, if it exists. If so, this is a re-play
				// of a lti widget
				if ($lti_token = \Input::get('ltitoken', false))
				{
					\Lti\Api::associate_lti_data($lti_token, $play_id);
				}

				$this->_display_widget($inst, $play_id, $embed);
			}
		}

	}

	public function action_draft_not_playable()
	{
			Package::load('casset');

			$this->theme->get_template()
				->set('title', 'Draft Not Playable')
				->set('page_type', '');

			$this->theme->set_partial('content', 'partials/widget/draft_not_playable');
	}

	public function action_retired()
	{
			Package::load('casset');

			$this->theme->get_template()
				->set('title', 'Retired Widget')
				->set('page_type', '');

			$this->theme->set_partial('content', 'partials/widget/retired');
	}

	public function action_preview_widget($inst_id)
	{
		if (Materia\Api::session_valid() !== true)
		{
			$this->_build_widget_login('Login to preview this widget', $inst_id);
		}
		else
		{
			$instances = Materia\Api::widget_instances_get([$inst_id]);
			if ( ! count($instances)) throw new HttpNotFoundException;
			$inst = $instances[0];

			// check ownership of widget
			if ( ! Materia\Perm_Manager::check_user_perm_to_object(\Model_User::find_current_id(), $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::FULL, Materia\Perm::VISIBLE]))
			{
				$this->no_permission();
				return;
			}
			elseif ( ! $inst->widget->is_playable)
			{
				$this->action_draft_not_playable();
			}
			else
			{
				$this->_display_widget($inst);
			}
		}

	}

	public function action_play_embedded($inst_id, $play_id=false)
	{
		$this->action_play_widget($inst_id, false, true, $play_id);
	}

	protected function _display_widget(\Materia\Widget_Instance $inst, $play_id=false, $embed=false)
	{
		Package::load('casset');
		Casset::enable_css(['widget_play']);
		Casset::enable_js(['widget_play']);
		Casset::js_inline('var __PLAY_ID = "'.$play_id.'";');

		$this->theme->get_template()
			->set('title', $inst->name.' '.$inst->widget->name)
			->set('page_type', $embed ? 'embedded widget' : 'widget' );

		$this->theme->set_partial('content', 'partials/widget/play')
			->set('inst_id', $inst->id);

		if ($embed) $this->_header = 'partials/header_empty';
	}

	/**
	 * Determine if a widget is playable
	 * @return Number -1: not avail yet, no end time, -2: not avail yet, has end time, 1: closed, 0.5, completely open
	 *
	 */
	protected function _get_status($inst)
	{
		$now           = time();
		$start         = (int) $inst->open_at;
		$end           = (int) $inst->close_at;
		$attempts_used = count(\Materia\Score_Manager::get_instance_score_history($inst->id));
		$has_attempts  = $inst->attempts == -1 || $attempts_used < $inst->attempts;

		$opens       = $start > 0;
		$closes      = $end > 0;
		$always_open = ! $opens && ! $closes;
		$will_open   = $start > $now;
		$will_close  = $end > $now;
		$open        = $always_open              // unlimited availability
		  || ($start < $now && $will_close)      // now is between start and end
		  || ($start < $now && ! $closes);       // now is after start, never closes

		$closed = ! $always_open && ($closes && $end < $now);

		return [
			'open'         => $open,
			'closed'       => $closed,
			'opens'        => $opens,
			'closes'       => $closes,
			'will_open'    => $will_open,
			'will_close'   => $will_close,
			'always_open'  => $always_open,
			'has_attempts' => $has_attempts,
		];
	}

	protected function _build_widget_login_messages($inst)
	{
		$format = 'm/d/y';
		$desc   = $summary = '';
		$status = $this->_get_status($inst);

		// Build the open/close dates for display
		if ($status['opens'])
		{
			$start_string = '<span class="available_date">'.date($format, (int) $inst->open_at).'</span>';
			$start_sec    = '<span class="available_time">'.((int) $inst->open_at * 1000).'</span>';
		}
		if ($status['closes'])
		{
			$end_string   = '<span class="available_date">'.date($format, (int) $inst->close_at).'</span>';
			$end_sec      = '<span class="available_time">'.((int) $inst->close_at * 1000).'</span>';
		}

		// finish the actual messages to the user
		if ($status['closed'])
		{
			$summary = "Closed on $end_string";
			$desc    = "This widget closed on $end_string at $end_sec and cannot be accessed.";
		}
		if ($status['open'] && $status['will_close'])
		{
			$summary = "Available until $end_string at $end_sec";
		}
		if ($status['will_open'] && ! $status['will_close'])
		{
			$summary = "Available after $start_string at $start_sec ";
			$desc    = "This widget cannot be accessed at this time. Please return on or after $start_string at $start_sec ";
		}
		if ($status['will_open'] && $status['will_close'])
		{
			$summary = "Available from $start_string at $start_sec until $end_string at $end_sec";
			$desc    = "This widget cannot be accessed at this time. Please return between $start_string at $start_sec and $end_string at $end_sec";
		}
		return [$summary, $desc, $status['open']];
	}

	/**
	 * Load the login screen and possibly widget information if it's needed
	 */
	protected function _build_widget_login($login_title = null, $inst_id = null, $embed=false)
	{
		if (empty($inst_id)) throw new HttpNotFoundException;
		$inst = Materia\Widget_Instance_Manager::get($inst_id);
		if ( ! ($inst instanceof Materia\Widget_Instance) ) throw new HttpNotFoundException;

		Session::set('redirect_url', URI::current());

		// ===================== AVAILABILITY MODES ==========================
		list($summary, $desc, $is_open) = $this->_build_widget_login_messages($inst);

		// to properly fix the date display, we need to provide the raw server date for JS to access
		$server_date  = date_create('now', timezone_open('UTC'))->format('D, d M Y H:i:s');

		// ===================== RENDER ==========================
		Package::load('casset');
		Casset::enable_js(['login']);
		Casset::enable_css(['login']);

		$this->theme->get_template()
			->set('title', $login_title ?: 'Login')
			->set('page_type', 'login');

		$is_preview = preg_match('/preview/', URI::current());

		if ($is_open)
		{
			$content = $this->theme->set_partial('content', 'partials/widget/login');
			$content
				->set('user', __('user'))
				->set('pass', __('password'))
				->set('links', __('links'))
				->set('title', $login_title)
				->set('date', $server_date)
				->set('preview', $is_preview);
		}
		else
		{
			$content = $this->theme->set_partial('content', 'partials/widget/closed');
			$content
				->set('msg', __('user'))
				->set('date', $server_date)
				->set_safe('availability', $desc);
		}

		// add widget summary
		$content->set('classes', 'widget '.($is_preview ? 'preview' : ''))
			->set('summary', $this->theme->view('partials/widget/summary')
				->set('type',$inst->widget->name)
				->set('name', $inst->name)
				->set('icon', Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png")
				->set_safe('avail', $summary));

		if ($embed) $this->_header = 'partials/header_empty';
	}

	protected function no_permission()
	{
		Package::load('casset');
		Casset::enable_js(['homepage']);
		Casset::enable_css(['homepage']);

		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/nopermission');
	}

public function action_no_attempts($inst)
	{
		Package::load('casset');
		Casset::enable_css(['login']);

		$this->theme->get_template()
			->set('title', 'Widget Unavailable')
			->set('page_type', 'login');

		$this->theme->set_partial('content', 'partials/widget/no_attempts')
			->set('classes', 'widget')
			->set('attempts', $inst->attempts)
			->set('scores_path', '/scores/'.$inst->id)

			->set('summary', $this->theme->view('partials/widget/summary')
				->set('type',$inst->widget->name)
				->set('name', $inst->name)
				->set('icon', Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png"));
	}
}