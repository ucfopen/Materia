<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api extends Controller_Rest
{

	protected $_supported_formats = [
		'json' => 'application/json',
		'jsonp' => 'text/javascript',
	];

	public function after($response)
	{
		$response = parent::after($response);

		// Set no cache
		$response->set_header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
		$response->set_header('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
		$response->set_header('Pragma', 'no-cache');

		return $response;
	}

	public function post_call($version, $format, $method)
	{
		$input = Input::post('data', []);

		$data = $this->decode($format, $input);

		$result = $this->execute($version, $method, $data);

		$this->response($result, 200);
	}

	public function get_call($version, $format, $method)
	{
		$data = array_slice($this->request->route->method_params, 3);

		$result = $this->execute($version, $method, $data);

		$this->response($result, 200);
	}


	protected function decode($format, $input)
	{
		switch ($format)
		{
			case 'json':
			case 'jsonp':
			default:
				$data = json_decode($input);
				break;
		}
		return $data;
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
			\RocketDuck\Log::profile([get_class($e), get_class($api), $method, json_encode($args)], 'exception');
			trace($e);
		}
	}
}