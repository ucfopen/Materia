<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api extends Controller_Rest
{

	use Trait_Apiutils;

	protected $_supported_formats = ['json' => 'application/json'];

	public function before()
	{
		// bare bones CSRF mitigation
		$headers = \Input::headers();
		$header_origin = $headers['Origin'] ?? null;
		// if Origin is missing - fail immediately
		if ( ! isset($header_origin) || empty($header_origin))
		{
			throw new HttpServerErrorException;
		}
		$expected_origin = \Config::get('materia.urls.root');
		// URI generation in Fuel adds a trailing slash which may be absent from the Origin header
		// if it's missing, add it
		if (substr($header_origin, -1) != '/')
		{
			$header_origin .= '/';
		}

		// check to make sure Origin matches the expected root URL first
		if ($header_origin != $expected_origin)
		{
			throw new HttpServerErrorException;
		}
		// make sure Referer matches Origin
		if (substr($headers['Referer'], 0, strlen($header_origin)) != $header_origin)
		{
			throw new HttpServerErrorException;
		}

		parent::before();
	}

	public function post_call($version, $format, $method)
	{
		$input = json_decode(Input::post('data', []));

		$result = $this->execute($version, $method, $input);

		$this->no_cache();
		$this->response($result, 200);
	}

	public function get_call($version, $format, $method)
	{
		$data   = array_slice($this->request->route->method_params, 3);
		$result = $this->execute($version, $method, $data);

		$this->no_cache();
		$this->response($result, 200);
	}

	protected function execute($version, $method, $args)
	{
		$api = Materia\Api::get_version($version);

		if ( ! method_exists($api, $method)) throw new HttpNotFoundException;

		try
		{
			$result = call_user_func_array([$api, $method], $args);
			return $result;
		}
		catch (\Exception $e)
		{
			Materia\Log::profile([get_class($e), get_class($api), $method, json_encode($args)], 'exception');
			trace($e);
		}
	}
}
