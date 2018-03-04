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

		Event::trigger('request_login', $direct_login);

		Css::push_group(['core', 'login']);
		Js::push_group(['angular', 'materia']);

		$this->theme->get_template()
			->set('title', 'Login')
			->set('page_type', 'login');

		$this->theme->set_partial('content', 'partials/login')
			->set('redirect', urlencode($redirect));
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
			Session::set_flash('notice', 'Please log in to view this page.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		Css::push_group(['core', 'profile']);

		Js::push_group(['angular', 'materia', 'student']);

		// to properly fix the date display, we need to provide the raw server date for JS to access
		$server_date  = date_create('now', timezone_open('UTC'))->format('D, d M Y H:i:s');
		Js::push_inline("var DATE = '$server_date'");

		$this->theme->get_template()
			->set('title', 'Profile')
			->set('page_type', 'user profile');

		$this->theme->set_partial('footer', 'partials/angular_alert');
		$this->theme->set_partial('content', 'partials/user/profile')
			->set('me', \Model_User::find_current());
	}

	/**
	 * Displays information about the currently logged-in user
	 *
	 */
	public function get_settings()
	{
		if (\Service_User::verify_session() !== true)
		{
			Session::set_flash('notice', 'Please log in to view this page.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		Css::push_group(['core', 'profile']);
		Js::push_group(['angular', 'materia', 'student']);

		$this->theme->get_template()
			->set('title', 'Settings')
			->set('page_type', 'user profile settings');

		$this->theme->set_partial('footer', 'partials/angular_alert');
		$this->theme->set_partial('content', 'partials/user/settings')
			->set('me', \Model_User::find_current());
	}

}
