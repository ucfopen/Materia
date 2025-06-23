<?php
/**
 * Materia
 * License outlined in licenses folder
 */
use \Materia\Widget_Asset_Manager;
use \Materia\Widget_Asset;
use \Thirdparty\Oauth;

class Controller_Media extends Controller
{

	use Trait_CommonControllerTemplate;
	use Trait_DarkMode;

	// overrides Trait_CommonControllerTemplate->before()
	public function before()
	{}

	// overrides Trait_CommonControllerTemplate->after()
	public function after($response)
	{
		return parent::after($response);
	}

	public function get_render($asset_id, $size='original')
	{
		$asset = Widget_Asset::fetch_by_id($asset_id);

		if ( ! ($asset instanceof Widget_Asset))
		{
			trace("Asset: {$asset_id} not found");
			throw new HttpNotFoundException;
		}

		$asset->render($size);

		// I can't exactly remember why this is here
		// IIRC it solved some bug with IE?
		return '';
	}

	public function get_import()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true) throw new HttpNotFoundException;

		$this->inject_common_js_constants();

		$theme = Theme::instance();
		$theme->set_template('layouts/react');
		$theme->get_template()
			->set('title', 'Media Catalog')
			->set('page_type', 'import');

		Css::push_group(['media_import']);
		Js::push_group(['react', 'media']);

		if ($this->is_using_darkmode())
		{
			$theme->get_template()->set('darkmode', true);
		}

		return Response::forge($theme->render());
	}

	// Handles the upload using plupload's classes
	// This currently assumes a single uploaded file at a time
	public function action_upload()
	{
		// Either Validate Logged in
		// or validate a third party server thru Oauth
		if (\Service_User::verify_session() !== true)
			if (Oauth::validate_post() !== true) 
				throw new HttpNotFoundException;

		$res = new Response();
		// Make sure file is not cached (as it happens for example on iOS devices)
		$res->set_header('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
		$res->set_header('Last-Modified', gmdate('D, d M Y H:i:s').' GMT');
		$res->set_header('Cache-Control', 'no-store, no-cache, must-revalidate');
		$res->set_header('Pragma', 'no-cache');


		// Upload::process is called automatically
		if (\Upload::is_valid()) \Upload::save();

		$errors = [];
		$error_codes = [];
		if ($file_info = \Upload::get_errors(0))
		{
			foreach ($file_info['errors'] as $value)
			{
				$errors[] = $value['message'];
				$error_codes[] = $value['error'];
			}
		}

		$uploaded_file = \Upload::get_files(0);
		
		if ( ! $uploaded_file)
		{
			trace('Unable to process upload');
			trace($error_codes);
			trace($errors);
			$res->body('{"error":{"code":"'.implode(',', $error_codes).'","message":"'.implode('. ', $errors).'"}}');
			$res->set_status(400);
			return $res;
		}

		$file_info = [
			'size' => $uploaded_file['size'],
			'extension' => $uploaded_file['extension'],
			'realpath' => $uploaded_file['saved_to'].DS.$uploaded_file['saved_as']
		];

		$name = Input::post('name', 'New Asset');

		try {
			$asset = Widget_Asset_Manager::new_asset_from_file($name, $file_info);
		}
		catch (\Exception $e) {
			$res->body('{"error":{"message":"Unable to save new asset"}}');
			$res->set_status(400);
			return $res;
		}

		if ( ! $asset || ! isset($asset->id))
		{
			// error
			\Log::Error('Unable to create asset');
			$res->body('{"error":{"code":"16","message":"Unable to save new asset"}}');
			$res->set_status(400);
			return $res;
		}

		$res->body('{"success":"true","id":"'.$asset->id.'"}');
		$res->set_status(200);
		return $res;
	}

}
