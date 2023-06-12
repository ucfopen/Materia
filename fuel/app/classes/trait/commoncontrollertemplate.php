<?php
/**
 * Materia
 * License outlined in licenses folder
 */

trait Trait_CommonControllerTemplate
{
	use Trait_Analytics;

	protected $_header = 'partials/header';
	protected $_disable_browser_cache = false;

	public function before()
	{
		$this->theme = Theme::instance();
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			$this->insert_analytics();
			$response = Response::forge(Theme::instance()->render());
		}

		if ($this->_disable_browser_cache)
		{
			// prevent caching the widget page, since the PLAY_ID is hard coded into the page
			$response->set_header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
		}

		$this->inject_common_js_constants();

		return parent::after($response);
	}

	public function inject_common_js_constants()
	{
		$consts = [
			'BASE_URL'           => Uri::base(),
			'WIDGET_URL'         => Config::get('materia.urls.engines'),
			'MEDIA_URL'          => Config::get('materia.urls.media'),
			'MEDIA_UPLOAD_URL'   => Config::get('materia.urls.media_upload'),
			'STATIC_CROSSDOMAIN' => Config::get('materia.urls.static'),
		];

		foreach ($consts as $key => $value)
		{
			Js::push_inline("var {$key} = '{$value}';");
		}
	}
}
