<?
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Upload extends Controller
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

		// prevent caching the widget page, since the __play_id is hard coded into the page
		$response->set_header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');

		return parent::after($response);
	}

	/**
	 * Catalog page to show all the available widgets
	 *
	 * @login Not required
	 */
	public function action_index()
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		Package::load('casset');
		Casset::enable_js(['upload']);
		Casset::enable_css(['upload']);

		$this->theme->get_template()
			->set('title', 'Upload a widget')
			->set('page_type', 'upload');

		$this->theme->set_partial('content', 'partials/upload');
	}

	public function action_upload()
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in');
			Response::redirect(Router::get('login').'?redirect='.URI::current());
		}

		// Custom configuration for this upload
		$config = array(
			'path' => '/tmp/',
			'randomize' => true,
			'ext_whitelist' => array('wigt'),
		);

		// process the uploaded files in $_FILES
		Upload::process($config);

		$failed = true;

		// if there are any valid files
		if (Upload::is_valid())
		{
			$failed = false;
			// save them according to the config
			Upload::save();

			foreach (Upload::get_files() as $file) {
				$path = $file["saved_to"].$file["saved_as"];
				if (!Materia\Widget_Installer::force_install($path))
				{
					$failed = true;
					break;
				}
			}
		}

		if (!$failed)
		{
			Session::set_flash('notice', 'Success');
		}
		else
		{
			Session::set_flash('notice', 'Failed');
		}

		Package::load('casset');
		Casset::enable_js(['upload']);
		Casset::enable_css(['upload']);

		$this->theme->get_template()
			->set('title', 'Upload a widget')
			->set('page_type', 'upload');

		Response::redirect(Router::get('upload'));
		$this->theme->set_partial('content', 'partials/upload');
	}
}

