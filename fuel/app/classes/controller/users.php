<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Users extends Controller
{
	use Trait_CommonControllerTemplate;

	/**
	 * Uses Materia API's remote_login function to log the user in.
	 *
	 */
	public function get_login()
	{
		// figure out where to send if logged in
		$redirect = Input::get('redirect') ?: Router::get('profile');
		$direct_login = isset($_GET['directlogin']) || Session::get_flash('direct_login', false);
		if ($direct_login) Session::set_flash('direct_login', true);

		if ( ! Model_User::find_current()->is_guest())
		{
			// already logged in
			Response::redirect($redirect);
		}
		
		Js::push_inline('var LOGIN_USER = "'.\Lang::get('login.user').'";');
		Js::push_inline('var LOGIN_PW = "'.\Lang::get('login.password').'";');

		// condense login links into a string with delimiters to be embedded as a JS global
		$link_items = [];
		foreach (\Lang::get('login.links') as $a)
		{
			$link_items[] = $a['href'].'***'.$a['title'];
		}
		$login_links = implode('@@@', $link_items);
		Js::push_inline('var LOGIN_LINKS = "'.urlencode($login_links).'";');

		// additional JS globals. Previously, these were rendered directly in the partial view. Now we have to hand them off 
		// to the React template to be rendered.
		Js::push_inline('var ACTION_LOGIN = "'.\Router::get('login').'";');
		Js::push_inline('var ACTION_REDIRECT = "'.$redirect.'";');
		Js::push_inline('var ACTION_DIRECTLOGIN = "'.($direct_login ? 'true' : 'false').'";');

		Js::push_inline('var BYPASS  = "'.(Session::get_flash('bypass', false, false) ? 'true' : 'false').'";');

		// conditionally add globals if there is an error or notice
		if ($msg = Session::get_flash('login_error'))
		{
			Js::push_inline('var ERR_LOGIN = "'.$msg.'";');
		}
		if ($notice = (array) Session::get_flash('notice'))
		{
			Js::push_inline('var NOTICE_LOGIN = "'.implode('</p><p>', $notice).'";');
		}

		Event::trigger('request_login', $direct_login);

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()
			->set('title', 'Login')
			->set('page_type', 'login');

		Css::push_group(['login']);
		Js::push_group(['react', 'login']);
	}

	public function post_login()
	{
		// figure out if we got here from direct login
		$direct_login = Session::get_flash('direct_login', false);
		if ($direct_login) Session::set_flash('direct_login', true); // extend the flash

		// figure out where to send if logged in
		$redirect = Input::get('redirect') ?: Router::get('profile');
		$login = Materia\Api::session_login(Input::post('username'), Input::post('password'));

		if ($login === true)
		{
			Session::delete_flash('direct_login');
			// if the location is the profile and they are an author, send them to my-widgets instead
			if (\Service_User::verify_session('basic_author') == true && $redirect == Router::get('profile'))
			{
				$redirect = 'my-widgets';
			}
			Response::redirect($redirect);
		}
		else
		{
			$msg = \Service_User::check_rate_limiter() ? 'ERROR: Username and/or password incorrect.' : 'Login locked due to too many attempts.';
			Session::set_flash('login_error', $msg);
			$this->get_login();
		}
	}

	/**
	 * Uses Materia API's remote_logout function to log the user in.
	 *
	 */
	public function action_logout()
	{
		Materia\Api::session_logout();
		Response::redirect(Router::get('login'));
	}

	/**
	 * Displays information about the currently logged-in user
	 *
	 */
	public function get_profile()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your profile.');
			Response::redirect(Router::get('login'));
			return;
		}

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'My Profile');

		Css::push_group(['profile']);
		Js::push_group(['react', 'profile']);
	}

	/**
	 * Displays information about the currently logged-in user
	 *
	 */
	public function get_settings()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your profile settings.');
			Response::redirect(Router::get('login'));
			return;
		}

		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/react');
		$this->theme->get_template()->set('title', 'Settings');

		Css::push_group(['profile']);
		Js::push_group(['react', 'settings']);
	}

}
