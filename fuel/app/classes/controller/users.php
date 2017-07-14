<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Users extends Controller
{
	use Lib_CommonControllerTemplateTrait;

	/**
	 * Uses Materia API's remote_login function to log the user in.
	 *
	 */
	public function get_login()
	{
		// figure out where to send if logged in
		$redirect = Input::get('redirect') ?: Router::get('profile');
		$bypass = isset($_GET['directlogin']) ? true : false;

		if ( ! Model_User::find_current()->is_guest())
		{
			// already logged in
			Response::redirect($redirect);
		}

		Event::trigger('request_login', $bypass);

		Css::push_group(['core', 'login']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		Session::set_flash('bypass', $bypass);

		$this->theme->get_template()
			->set('title', 'Login')
			->set('page_type', 'login');

		$this->theme->set_partial('content', 'partials/login')
			->set('redirect', urlencode($redirect));
	}

	public function post_login()
	{
		// figure out where to send if logged in
		$redirect = Input::get('redirect') ?: Router::get('profile');
		$login = Materia\Api::session_login(Input::post('username'), Input::post('password'));
		if ($login === true)
		{
			Session::delete_flash('bypass');
			// if the location is the profile and they are an author, send them to my-widgets instead
			if (\Model_User::verify_session('basic_author') == true && $redirect == Router::get('profile'))
			{
				$redirect = 'my-widgets';
			}
			Response::redirect($redirect);
		}
		else
		{
			$msg = \Model_User::check_rate_limiter() ? 'ERROR: Username and/or password incorrect.' : 'Login locked due to too many attempts.';
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
		if (\Model_User::verify_session() !== true)
		{
			Session::set_flash('notice', 'Please log in to view this page.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		Css::push_group(['core', 'profile']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		// to properly fix the date display, we need to provide the raw server date for JS to access
		$server_date  = date_create('now', timezone_open('UTC'))->format('D, d M Y H:i:s');
		Js::push_inline("var DATE = '$server_date'");

		$this->theme->get_template()
			->set('title', 'Profile')
			->set('page_type', 'user profile');

		$this->theme->set_partial('content', 'partials/user/profile')
			->set('me', \Model_User::find_current());
	}

	/**
	 * Displays information about the currently logged-in user
	 *
	 */
	public function get_settings()
	{
		if (\Model_User::verify_session() !== true)
		{
			Session::set_flash('notice', 'Please log in to view this page.');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		Css::push_group(['core', 'profile']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);

		$this->theme->get_template()
			->set('title', 'Settings')
			->set('page_type', 'user profile settings');

		$this->theme->set_partial('content', 'partials/user/settings')
			->set('me', \Model_User::find_current());
	}

}