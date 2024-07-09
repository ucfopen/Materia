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

	/**
	 * Recursively search for the status code in execution result
	 * @param Array
	 * @return Integer
	 */
	public function get_status($data)
	{
		if (is_array($data) || is_object($data))
		{
			foreach ($data as $key => $value)
			{
				if ($key === 'status')
				{
					return $value;
				}
				elseif (is_array($key) || is_object($key))
				{
					$result = $this->get_status($key);
					if ($result !== null)
					{
						return $result;
					}
				}
			}
		}
	}

	public function post_call($version, $format, $method)
	{
		$input = json_decode(Input::post('data', []));

		$result = $this->execute($version, $method, $input);

		$status = $this->get_status($result);

		if ( ! $status)
		{
			$status = 200;
		}

		$this->no_cache();
		$this->response($result, $status);
	}

	public function get_call($version, $format, $method)
	{
		$data   = array_slice($this->request->route->method_params, 3);
		$result = $this->execute($version, $method, $data);

		$status = $this->get_status($result);

		if ( ! $status)
		{
			$status = 200;
		}

		$this->no_cache();
		$this->response($result, $status);
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
			if ($e instanceof \HttpNotFoundException)
			{
				return Materia\Msg::not_found();
			}
			else
			{
				throw new HttpServerErrorException;
			}
		}
	}
}
