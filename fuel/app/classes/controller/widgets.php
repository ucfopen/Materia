<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets extends Controller
{
	use Trait_CommonControllerTemplate;
	use Trait_S3ResponseTrait;

	protected $_embedded = false;

	/**
	 * Catalog page to show all the available widgets
	 *
	 * @login Not required
	 */
	public function get_index($type = null)
	{
		// $type is an optional flag that provides optional display parameters for the catalog
		// "all" displays all widgets in the database, not just the default "featured" ones
		if (isset($type))
		{
			if ($type == 'all') // could be extended to include other options
			{
				Js::push_inline('var DISPLAY_TYPE = "'.$type.'";');
			}
			else throw new HttpNotFoundException;
		}

		Css::push_group(['core', 'widget_catalog']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);

		$this->theme->get_template()
			->set('title', 'Widget Catalog')
			->set('page_type', 'catalog');

		$this->theme->set_partial('content', 'partials/widget/catalog');
	}

	/**3
	 * Catalog page for an individual widget
	 *
	 * @param string The clean name of the widget to load
	 * @login Not Required
	 */
	public function get_detail()
	{
		$widget = DB::select()
			->from('widget')
			->where('id', $this->param('id'))
			->execute();

		if ( ! $widget) throw new HttpNotFoundException;

		Css::push_group(['widget_detail', 'core']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'fancybox']);

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
	public function get_create()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to create this widget.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		$widget = new Materia\Widget();
		$loaded = $widget->get($this->param('id'));

		if ( ! $loaded) throw new HttpNotFoundException;

		View::set_global('me', Model_User::find_current());
		$this->show_editor('Create Widget', $widget);
	}

	/**
	 * Loads the creator for the given widget and the given inst_id
	 * @param $widgetName
	 * @param $inst_id
	 * @login required
	 */
	public function get_edit($inst_id)
	{
		if (empty($inst_id)) throw new HttpNotFoundException;

		if (\Service_User::verify_session() !== true)
		{
			Session::set_flash('notice', 'Please log in to edit this widget.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		if ( ! Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::FULL]))
		{
			$this->no_permission();
			return;
		}

		$inst = new Materia\Widget_Instance();
		$inst->db_get($inst_id);
		$this->show_editor('Edit Widget', $inst->widget, $inst_id);
	}

	/**
	 * Listing of all widgets i have rights to
	 */
	public function get_mywidgets()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your widgets.');
			Response::redirect(Router::get('login'));
		}

		Css::push_group(['core', 'my_widgets']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'tablock', 'spinner', 'jqplot', 'my_widgets', 'dataTables']);

		Js::push_inline('var IS_STUDENT = '.(\Service_User::verify_session(['basic_author', 'super_user']) ? 'false;' : 'true;'));

		$this->theme->get_template()
			->set('title', 'My Widgets')
			->set('page_type', 'my_widgets');

		$this->theme->set_partial('content', 'partials/my_widgets');
	}

	public function get_play_demo()
	{
		$widget = new Materia\Widget();
		$loaded = $widget->get($this->param('id'));

		if ( ! $loaded || ! isset($widget->meta_data['demo'])) throw new HttpNotFoundException;
		return $this->_play_widget($widget->meta_data['demo'], true);
	}

	public function action_play_widget($inst_id = false)
	{
		return $this->_play_widget($inst_id);
	}

	public function action_play_embedded($inst_id = false)
	{
		Session::set('context_id', \Input::post('context_id'));
		$this->_header = 'partials/header_empty';
		$this->_embedded = true;
		return $this->_play_widget($inst_id, false, true);
	}

	public function get_preview_widget($inst_id)
	{
		if (\Service_User::verify_session() !== true)
		{
			$this->build_widget_login('Login to preview this widget', $inst_id);
		}
		else
		{
			$inst = Materia\Widget_Instance_Manager::get($inst_id);
			if ( ! $inst) throw new HttpNotFoundException;

			// check ownership of widget
			if ( ! Materia\Perm_Manager::user_has_any_perm_to(\Model_User::find_current_id(), $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::FULL, Materia\Perm::VISIBLE]))
			{
				$this->no_permission();
				return;
			}
			elseif ( ! $inst->widget->is_playable)
			{
				$this->draft_not_playable();
			}
			else
			{
				$this->display_widget($inst);
			}
		}

		Css::push_group('widget_play');

	}

	/* ============================== PROTECTED ================================== */


	protected function show_editor($title, $widget, $inst_id=null)
	{
		$this->_disable_browser_cache = true;
		Css::push_group(['core', 'widget_editor']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'swfobject']);
		$this->add_s3_config_to_response();
		$this->theme->get_template()
			->set('title', $title)
			->set('page_type', 'create');

		$this->theme->set_partial('content', 'partials/widget/create')
			->set('widget', $widget)
			->set('inst_id', $inst_id);
	}

	protected function draft_not_playable()
	{
		$this->_disable_browser_cache = true;
		$this->theme->get_template()
			->set('title', 'Draft Not Playable')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/widget/draft_not_playable');

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);
	}

	protected function retired()
	{
		$this->theme->get_template()
			->set('title', 'Retired Widget')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/widget/retired');

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);
	}

	protected function no_attempts($inst)
	{
		$this->_disable_browser_cache = true;
		$this->theme->get_template()
			->set('title', 'Widget Unavailable')
			->set('page_type', 'login');

		$this->theme->set_partial('content', 'partials/widget/no_attempts')
			->set('classes', 'widget')
			->set('attempts', $inst->attempts)
			->set('scores_path', '/scores'.($this->_embedded ? '/embed' : '').'/'.$inst->id)

			->set('summary', $this->theme->view('partials/widget/summary')
				->set('type',$inst->widget->name)
				->set('name', $inst->name)
				->set('icon', Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png"));

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);
		// The styles for this are in login, should probably be moved?
		Css::push_group('login');
	}

	protected function no_permission()
	{
		$this->_disable_browser_cache = true;
		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		$this->theme->set_partial('content', 'partials/nopermission');

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);
	}

	protected function embedded_only($inst)
	{
		$this->theme->get_template()
			->set('title', 'Widget Unavailable')
			->set('page_type', 'login');

		$this->theme->set_partial('content', 'partials/widget/embedded_only')
			->set('classes', 'widget')

			->set('summary', $this->theme->view('partials/widget/summary')
				->set('type',$inst->widget->name)
				->set('name', $inst->name)
				->set('icon', Config::get('materia.urls.engines')."{$inst->widget->dir}img/icon-92.png"));

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author']);
		// The styles for this are in login, should probably be moved?
		Css::push_group('login');
	}

	protected function _play_widget($inst_id = false, $demo=false, $is_embedded=false)
	{
		$this->_disable_browser_cache = true;
		$results = \Event::trigger('before_play_start', ['inst_id' => $inst_id, 'is_embedded' => $is_embedded], 'array');
		$context_id = false;

		foreach ($results as $result)
		{
			// allow events to redirect
			if ( ! empty($result['redirect'])) Response::redirect($result['redirect']);

			// allow events to set inst_id
			if ( ! empty($result['inst_id'])) $inst_id = $result['inst_id'];

			// allow events to set context_id
			$context_id = empty($result['context_id']) ? false : $result['context_id'];

			// this widget is being played within an LTI, but wasn't embedded with the right URL
			if ( ! $is_embedded && ! empty($result['force_embedded'])) $is_embedded = $result['force_embedded'];
		}

		$inst = Materia\Widget_Instance_Manager::get($inst_id);
		if ( ! $inst) throw new HttpNotFoundException;

		// Disable header if embedded, prior to setting the widget view or any login/error screens
		if ($is_embedded) $this->_header = 'partials/header_empty';

		if ( ! $is_embedded && $inst->embedded_only) return $this->embedded_only($inst);

		// display a login
		if ( ! $inst->playable_by_current_user())
		{
			return $this->build_widget_login('Login to play this widget', $inst_id, $is_embedded);
		}

		$status = $inst->status($context_id);

		if ( ! $status['open']) return $this->build_widget_login('Widget Unavailable', $inst_id);
		if ( ! $demo && $inst->is_draft) return $this->draft_not_playable();
		if ( ! $demo && ! $inst->widget->is_playable) return $this->retired();
		if ( ! $status['has_attempts']) return $this->no_attempts($inst);

		// create the play
		$play_id = \Materia\Api::session_play_create($inst_id, $context_id);

		if ($play_id instanceof \RocketDuck\Msg)
		{
			\Log::warning('session_play_create failed!');
			throw new HttpServerErrorException;
		}

		$this->display_widget($inst, $play_id, $is_embedded);
	}

	/**
	 * Load the login screen and possibly widget information if it's needed
	 */
	protected function build_widget_login($login_title = null, $inst_id = null, $is_embedded=false)
	{
		if (empty($inst_id)) throw new HttpNotFoundException;
		$inst = Materia\Widget_Instance_Manager::get($inst_id);
		if ( ! ($inst instanceof Materia\Widget_Instance) ) throw new HttpNotFoundException;

		Session::set('redirect_url', URI::current());

		// ===================== AVAILABILITY MODES ==========================
		list($summary, $desc, $is_open) = $this->build_widget_login_messages($inst);

		// to properly fix the date display, we need to provide the raw server date for JS to access
		$server_date  = date_create('now', timezone_open('UTC'))->format('D, d M Y H:i:s');

		// ===================== RENDER ==========================
		$this->theme->get_template()
			->set('title', $login_title ?: 'Login')
			->set('page_type', 'login');

		$is_preview = preg_match('/preview/', URI::current());

		if ($is_open)
		{
			// fire an event prior to deciding which theme to render
			$alt = \Event::Trigger('before_widget_login');
			// if something came back as a result of the event being triggered, use that instead of the default
			$theme = $alt ?: 'partials/widget/login';
			$content = $this->theme->set_partial('content', $theme);
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

		if ($is_embedded) $this->_header = 'partials/header_empty';

		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);
		Css::push_group('login');
	}

	protected function build_widget_login_messages($inst)
	{
		$format = 'm/d/y';
		$desc   = $summary = '';
		$status = $inst->status();

		// Build the open/close dates for display
		if ($status['opens'])
		{
			$start_string = '<span class="available_date">'.date($format, (int) $inst->open_at).'</span>';
			$start_sec    = '{{ time('.((int) $inst->open_at * 1000).') }}';
		}
		if ($status['closes'])
		{
			$end_string   = '<span class="available_date">'.date($format, (int) $inst->close_at).'</span>';
			$end_sec      = '{{ time('.((int) $inst->close_at * 1000).') }}';
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

	protected function display_widget(\Materia\Widget_Instance $inst, $play_id=false, $is_embedded=false)
	{
		Css::push_group(['core', 'widget_play']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'student', 'swfobject']);

		Js::push_inline('var PLAY_ID = "'.$play_id.'";');
		$this->add_s3_config_to_response();
		$this->theme->get_template()
			->set('title', $inst->name.' '.$inst->widget->name)
			->set('page_type', 'widget')
			->set('html_class', $is_embedded ? 'embedded' : '' );

		$this->theme->set_partial('content', 'partials/widget/play')
			->set('inst_id', $inst->id);
	}
}
