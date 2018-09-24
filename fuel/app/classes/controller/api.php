<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api extends Controller_Rest
{

	use Trait_Apiutils;

	protected $_supported_formats = ['json' => 'application/json'];

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
