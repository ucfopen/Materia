<?php
/**
 * Materia
 * License outlined in licenses folder
 */
use \Materia\Widget_Asset_Manager;
use \Materia\Widget_Asset;

class Controller_Media extends Controller
{
	use Trait_S3ResponseTrait;

	public function get_show_asset($asset_id)
	{
		// Validate Logged in
		if ( ! (\Service_User::verify_session() === true || \Materia\Session_Play::is_user_playing() )) throw new HttpNotFoundException;

		$asset = Widget_Asset_Manager::get_asset($asset_id);

		// Validate Asset exists
		if ( ! ($asset instanceof Widget_Asset))
		{
			trace("Asset: {$asset_id} not found");
			throw new HttpNotFoundException;
		}

		$file = Config::get('materia.dirs.media')."{$asset->id}.{$asset->type}";

		// Validate file exists
		if ( ! file_exists($file))
		{
			trace("Asset file not found {$file}");
			throw new HttpNotFoundException;
		}

		File::render($file);

		return '';
	}

	public function get_show_large($asset_id)
	{
		$this->_show_resized($asset_id, 'large', 600);
		return '';
	}

	public function get_show_thumnail($asset_id)
	{
		$this->_show_resized($asset_id, 'thumbnail', 75, true);
		return '';
	}

	public function get_import()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true) throw new HttpNotFoundException;

		Css::push_group(['core', 'media_catalog']);
		Js::push_group(['angular', 'jquery', 'materia', 'author', 'dataTables']);

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static').'";');

		$this->add_s3_config_to_response();

		$theme = Theme::instance();
		$theme->set_template('layouts/main');
		$theme->get_template()
			->set('title', 'Media Catalog')
			->set('page_type', 'import');

		$theme->set_partial('footer', 'partials/angular_alert');
		$theme->set_partial('content', 'partials/catalog/media');

		return Response::forge($theme->render());
	}

	// Handles the upload using plupload's classes
	// This currently assumes a single uploaded file at a time
	public function action_upload()
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true) throw new HttpNotFoundException;

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
			$res->status(400);
			return $res;
		}

		$file_info = [
			'size' => $uploaded_file['size'],
			'extension' => $uploaded_file['extension'],
			'realpath' => $uploaded_file['saved_to'].DS.$uploaded_file['saved_as']
		];

		$name = Input::post('name', 'New Asset');
		$asset = Widget_Asset_Manager::new_asset_from_file($name, $file_info);

		if ( ! isset($asset->id))
		{
			// error
			trace('Unable to create asset');
			$res->body('{"error":{"code":"16","message":"Unable to save new asset"}}');
			$res->status(400);
			return $res;
		}

		$res->body('{"success":"true","id":"'.$asset->id.'"}');
		$res->status(200);
		return $res;
	}


	protected function _show_resized($asset_id, $size_name, $width, $crop=false)
	{
		// Validate Logged in
		if (\Service_User::verify_session() !== true ) throw new HttpNotFoundException;

		$asset = Widget_Asset_Manager::get_asset($asset_id);

		// Validate Asset exists
		if ( ! ($asset instanceof Widget_Asset)) throw new HttpNotFoundException;

		$resized_file = Config::get('materia.dirs.media').$size_name.'/'.$asset->id.'.'.$asset->type;
		// Validate file exists
		if ( ! file_exists($resized_file))
		{
			// thumb doesn't exist, build one if the original file exists
			$orig_file = Config::get('materia.dirs.media').$asset->id.'.'.$asset->type;
			if ( ! file_exists($orig_file)) throw new HttpNotFoundException;

			try
			{
				if ($crop)
				{
					Image::load($orig_file)
						->crop_resize($width, $width)
						->save($resized_file);
				}
				else
				{
					Image::load($orig_file)
						->resize($width, $width * (2 / 3))
						->save($resized_file);
				}
			}
			catch (\RuntimeException $e)
			{
				// use a default image instead
				$resized_file = Config::get('materia.dirs.media').$size_name.'/'.$asset->id.'.jpg';
				if ( ! file_exists($resized_file))
				{
					Image::load(Config::get('materia.no_media_preview'))
						->resize($width, $width)
						->save($resized_file);
				}
			}
		}

		return File::render($resized_file, null, null, 'media');
	}
}
