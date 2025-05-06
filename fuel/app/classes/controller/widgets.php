<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Widgets extends Controller
{
	use Trait_CommonControllerTemplate;
	use Trait_Supportinfo;

	/**
	 * Catalog page to show all the available widgets
	 *
	 * @login Not required
	 */
	public function get_index()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Widget Catalog');
		$this->theme->set_partial('meta', 'partials/responsive');

		Css::push_group(['catalog']);
		Js::push_group(['react', 'catalog']);
	}

	public function get_all()
	{
		$this->get_index();
	}


	/**
	 * Catalog page for an individual widget
	 *
	 * @param string The clean name of the widget to load
	 * @login Not Required
	 */
	public function get_detail()
	{
		$widget = new Materia\Widget();
		$loaded = $widget->get($this->param('id'));

		if ( ! $loaded) throw new HttpNotFoundException;

		$demo = $widget->meta_data['demo'];

		Js::push_inline('var NO_AUTHOR = "'.\Materia\Perm_Manager::does_user_have_role(['no_author']).'";');
		Js::push_inline('var WIDGET_HEIGHT = "'.$widget->height.'";');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Widget Details')
			->set('page_type', 'widget');

		Css::push_group(['detail']);
		Js::push_group(['react', 'detail']);
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

		if (\Materia\Perm_Manager::does_user_have_role(['no_author'])) throw new HttpNotFoundException;

		$widget = new Materia\Widget();
		$loaded = $widget->get($this->param('id'));

		if ( ! $loaded) throw new HttpNotFoundException;

		View::set_global('me', Model_User::find_current());
		$this->show_editor('Create Widget', $widget);
	}

	/**
	 * Loads guides for the given widget
	**/
	public function get_guide(string $type)
	{
		$widget = new Materia\Widget();
		$loaded = $widget->get($this->param('id'));
		if ( ! $loaded) throw new HttpNotFoundException;

		// build title and determine which guide to show
		$title = $widget->name;
		switch ($type)
		{
			case 'creators':
				$title .= " Creator's Guide";
				$guide = $widget->creator_guide;
				break;

			case 'players':
				$title .= " Player's Guide";
				$guide = $widget->player_guide;
				break;

			// @codingStandardsIgnoreLine
			default:
				throw new HttpNotFoundException;
				break;
		}

		Js::push_inline('var NAME = "'.$widget->name.'";');
		Js::push_inline('var TYPE = "'.$type.'";');
		Js::push_inline('var HAS_PLAYER_GUIDE = "'.( ! empty($widget->player_guide)).'";');
		Js::push_inline('var HAS_CREATOR_GUIDE = "'.( ! empty($widget->creator_guide)).'";');
		Js::push_inline('var DOC_PATH = "'.Config::get('materia.urls.engines').$widget->dir.$guide.'";');


		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', $title)
			->set('page_type', 'guide');

		Css::push_group(['guide']);
		Js::push_group(['react', 'guides']);
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
	 * Listing of all widgets a given user has rights to
	 */
	// this exists as an alternative to the next one for use with the React component
	// once we're sure that is good enough, replace the action after this one with this action, rename it, remove unnecessary routes etc.
	public function get_mywidgets()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your widgets.');
			Response::redirect(Router::get('login'));
			return;
		}

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'My Widgets');

		Css::push_group(['my_widgets']);
		Js::push_group(['react', 'my_widgets']);
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
		// if routed from the legacy LTI URL, the instance id is available as a GET parameter
		if ( ! $inst_id && \Input::get('widget') ) $inst_id = \Input::get('widget');
		// context_id isolates attempt count for an class so a user's attempt limit is reset per course
		Session::set('context_id', \Input::post('context_id'));
		return $this->_play_widget($inst_id, false, true);
	}

	public function get_play_embedded_preview(string $inst_id)
	{
		$this->get_preview_widget($inst_id, true);
	}

	public function get_preview_widget($inst_id, $is_embedded = false)
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
				$this->display_widget($inst, false, $is_embedded);
			}
		}
	}

	/* ============================== PROTECTED ================================== */


	protected function show_editor($title, $widget, $inst_id=null)
	{
		$this->_disable_browser_cache = true;

		Js::push_inline('var WIDGET_HEIGHT = "'.$widget->height.'";');
		Js::push_inline('var WIDGET_WIDTH = "'.$widget->width.'";');


		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', $title)
			->set('page_type', 'widget');

		Css::push_group(['widget_create']);
		Js::push_group(['react', 'createpage']);
	}

	protected function draft_not_playable()
	{
		$this->_disable_browser_cache = true;

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Draft Not Playable')
			->set('page_type', '');

		Js::push_group(['react', 'draft_not_playable']);
		Css::push_group(['login']);

		$this->add_inline_info();
	}

	protected function retired(bool $is_embedded = false)
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Retired Widget')
			->set('page_type', '');

		Js::push_group(['react', 'retired']);
		Css::push_group(['login']);

		Js::push_inline('var IS_EMBEDDED = "'.$is_embedded.'";');
	}

	protected function no_attempts(object $inst, bool $is_embedded)
	{
		$this->_disable_browser_cache = true;
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Widget Unavailable')
			->set('page_type', 'login');

		Js::push_inline('var ATTEMPTS = "'.$inst->attempts.'";');
		Js::push_inline('var WIDGET_ID = "'.$inst->id.'";');
		Js::push_inline('var IS_EMBEDDED = "'.$is_embedded.'";');
		Js::push_inline('var NAME = "'.$inst->name.'";');
		Js::push_inline('var ICON_DIR = "'.Config::get('materia.urls.engines').$inst->widget->dir.'";');

		// The styles for this are in login, should probably be moved?
		Css::push_group('login');
		Js::push_group(['react', 'no_attempts']);
	}

	protected function no_permission()
	{
		$this->_disable_browser_cache = true;
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Permission Denied')
			->set('page_type', '');

		Js::push_group(['react', 'no_permission']);
		Css::push_group('no_permission');
		$this->add_inline_info();
	}

	protected function embedded_only($inst)
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Widget Unavailable')
			->set('page_type', 'login');

		$theme_overrides = \Event::Trigger('before_embedded_only', '', 'array');
		if ($theme_overrides)
		{
			$this->theme->set_template('layouts/react');
			$this->theme->get_template()
				->set('title', 'Login')
				->set('page_type', 'login');

			Css::push_group([$theme_overrides[0]['css']]);
			Js::push_group(['react', $theme_overrides[0]['js']]);
		}
		else
		{
			Js::push_group(['react', 'embedded_only']);
			// The styles for this are in login, should probably be moved?
			Css::push_group('login');
		}

		Js::push_inline('var NAME = "'.$inst->name.'";');
		Js::push_inline('var ICON_DIR = "'.Config::get('materia.urls.engines').$inst->widget->dir.'";');
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

		if ( ! $is_embedded && $inst->embedded_only) return $this->embedded_only($inst);

		// display a login
		if ( ! $inst->playable_by_current_user())
		{
			return $this->build_widget_login('Login to play this widget', $inst_id, $is_embedded);
		}

		$status = $inst->status($context_id);

		if ( ! $status['open']) return $this->build_widget_login('Widget Unavailable', $inst_id, $is_embedded);
		if ( ! $demo && $inst->is_draft) return $this->draft_not_playable();
		if ( ! $demo && ! $inst->widget->is_playable) return $this->retired($is_embedded);
		if ( ! $status['has_attempts']) return $this->no_attempts($inst, $is_embedded);
		if (isset($_GET['autoplay']) && $_GET['autoplay'] === 'false') return $this->pre_embed_placeholder($inst);

		// create the play
		$play_id = \Materia\Api::session_play_create($inst_id, $context_id);

		if ($play_id instanceof \Materia\Msg)
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
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', $login_title ?: 'Login')
			->set('page_type', 'login');

		$is_preview = preg_match('/preview/', URI::current());

		if ($is_open)
		{
			// fire an event prior to deciding which theme to render
			// if something came back as a result of the event being triggered, use that instead of the default
			// theme_overrides object should include an array with a js and css index
			// these specify a) the react page to render and b) its associated css
			$theme_overrides = \Event::Trigger('before_widget_login', '', 'array');
			if ($theme_overrides)
			{
				$this->theme->set_template('layouts/react');
				$this->theme->get_template()
					->set('title', 'Login')
					->set('page_type', 'login');

				Css::push_group([$theme_overrides[0]['css']]);
				Js::push_group(['react', $theme_overrides[0]['js']]);
			}
			else
			{
				$this->theme->set_template('layouts/react');
				$this->theme->get_template()
					->set('title', 'Login')
					->set('page_type', 'login');

				Css::push_group(['login']);

				if (\Config::get('auth.restrict_logins_to_lti_single_sign_on', false))
				{
					Js::push_group(['react', 'restricted']);
				}
				else
				{
					Js::push_group(['react', 'login']);
				}
			}

			Js::push_inline('var EMBEDDED = '.($is_embedded ? 'true' : 'false').';');
			Js::push_inline('var ACTION_LOGIN = "'.\Router::get('login').'";');
			Js::push_inline('var ACTION_REDIRECT = "'.urlencode(URI::current()).'";');
			Js::push_inline('var LOGIN_USER = "'.\Lang::get('login.user').'";');
			Js::push_inline('var LOGIN_PW = "'.\Lang::get('login.password').'";');
			Js::push_inline('var CONTEXT = "widget";');
			Js::push_inline('var NAME = "'.$inst->name.'";');
			Js::push_inline('var WIDGET_NAME = "'.$inst->widget->name.'";');
			Js::push_inline('var IS_PREVIEW = "'.$is_preview.'";');
			Js::push_inline('var ICON_DIR = "'.Config::get('materia.urls.engines').$inst->widget->dir.'";');

			// condense login links into a string with delimiters to be embedded as a JS global
			$link_items = [];
			foreach (\Lang::get('login.links') as $a)
			{
				$link_items[] = $a['href'].'***'.$a['title'];
			}
			$login_links = implode('@@@', $link_items);
			Js::push_inline('var LOGIN_LINKS = "'.urlencode($login_links).'";');
		}
		else
		{
			Js::push_inline('var IS_EMBEDDED = '.($is_embedded ? 'true' : 'false').';');
			Js::push_inline('var NAME = "'.$inst->name.'";');
			Js::push_inline('var WIDGET_NAME = "'.$inst->widget->name.'";');
			Js::push_inline('var ICON_DIR = "'.Config::get('materia.urls.engines').$inst->widget->dir.'";');

			Js::push_inline('var SUMMARY = "'.$summary.'";');
			Js::push_inline('var DESC = "'.$desc.'";');

			$this->theme->set_template('layouts/react');
			$this->theme->get_template()
				->set('title', 'Widget Unavailable')
				->set('page_type', 'login');

			Css::push_group(['login']);
			Js::push_group(['react', 'closed']);
		}
	}

	protected function build_widget_login_messages($inst)
	{
		$format = 'm/d/y';
		$desc   = $summary = '';
		$status = $inst->status();

		// Build the open/close dates for display
		if ($status['opens'])
		{
			// $start_string = '<span class="available_date">'.date($format, (int) $inst->open_at).'</span>';
			$start_string = date($format, (int) $inst->open_at);
			$start_sec    = date('h:i A', (int) $inst->open_at);
		}
		if ($status['closes'])
		{
			$end_string   = date($format, (int) $inst->close_at);
			$end_sec      = date('h:i A', (int) $inst->close_at);
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
		Js::push_inline('var PLAY_ID = "'.$play_id.'";');
		Js::push_inline('var DEMO_ID = "'.$inst->id.'";');
		Js::push_inline('var WIDGET_HEIGHT = "'.$inst->widget->height.'";');
		Js::push_inline('var WIDGET_WIDTH = "'.$inst->widget->width.'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');
		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var MEDIA_URL = "'.Config::get('materia.urls.media').'";');

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', $inst->name.' '.$inst->widget->name)
			->set('page_type', 'widget')
			->set('html_class', $is_embedded ? 'embedded' : '' );

		Css::push_group(['playpage']);
		Js::push_group(['react', 'playpage']);
	}

	protected function pre_embed_placeholder($inst)
	{
		$this->_disable_browser_cache = true;
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', $inst->name.' '.$inst->widget->name)
			->set('page_type', 'widget');

		$uri = URI::current();
		$context = strpos($uri, 'play/') != false ? 'play' : 'embed';

		Js::push_inline('var INST_ID = "'.$inst->id.'";');
		Js::push_inline('var CONTEXT = "'.$context.'";');
		Js::push_inline('var NAME = "'.$inst->name.'";');
		Js::push_inline('var ICON_DIR = "'.Config::get('materia.urls.engines').$inst->widget->dir.'";');

		Js::push_group(['react', 'pre_embed']);
		Css::push_group(['login','pre_embed_placeholder']);
	}
}
