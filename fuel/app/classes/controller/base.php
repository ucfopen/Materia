<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Base extends Controller_Template
{

	public function before()
	{
		parent::before();
		View::set_global('page_type', '');
		View::set_global('casset_template', '');
	}

	/**
	 * Validates login session and sets template variables accordingly
	 * @param bool Required - is the login required, if so, a failed login will return false
	 * @param bool Redirect - if set to true, redirect to login screen
	 * @param message The message to display on the login page
	 */
	protected function validate_session($required=false, $redirect_login=true, $flash_message='Please login to access your Materia account.')
	{

		if (Materia\Api::session_valid() !== true)
		{
			if ($required)
			{
				// if required redirect to login screen
				if ($redirect_login)
				{
					// keep track of where we want to return to
					Session::set_flash('notice', $flashMessage);
					Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
				}
				return false;
			}
		}
		return true;
	}

}
