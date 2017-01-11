<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Media extends Controller
{

	public function get_show_asset($asset_id)
	{
		// Validate Logged in
		if ( ! (\Model_User::verify_session() === true || \Materia\Session_Play::is_user_playing() )) throw new HttpNotFoundException;

		$asset = Materia\Widget_Asset_Manager::get_asset($asset_id);

		// Validate Asset exists
		if ( ! ($asset instanceof Materia\Widget_Asset)) throw new HttpNotFoundException;

		$file = Config::get('materia.dirs.media').$asset->id.'.'.$asset->type;

		// Validate file exists
		if ( ! file_exists($file)) throw new HttpNotFoundException;

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
		if (\Model_User::verify_session() !== true) throw new HttpNotFoundException;

		Css::push_group(['core', 'media_catalog']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'dataTables', 'plupload']);

		Js::push_inline('var BASE_URL = "'.Uri::base().'";');
		Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
		Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

		// if s3 is not enabled, default to local media upload url
		$s3_enabled = Config::get('materia.s3_config.s3_enabled');
		$s3_upload_url = "//".Config::get('materia.s3_config.bucket').".".Config::get('materia.s3_config.upload_url');
		$local_upload_url = Uri::base().Config::get('materia.urls.media_upload');
		$local_media_url = Uri::base().Config::get('materia.urls.media');

		Js::push_inline('var S3_ENABLED = '.($s3_enabled ? 'true':'false').';');
		Js::push_inline('var MEDIA_UPLOAD_URL = "'
			.($s3_enabled ? $s3_upload_url : $local_upload_url)
			.'";');
		// for thumbnail retrieval
		Js::push_inline('var MEDIA_URL = "'
			.($s3_enabled ? $s3_upload_url : $local_media_url)
			.'";');

		$theme = Theme::instance();
		$theme->set_template('layouts/main');
		$theme->get_template()
			->set('title', 'Media Catalog')
			->set('page_type', 'import');

		$theme->set_partial('content', 'partials/catalog/media');

		return Response::forge($theme->render());
	}

	// Handles the upload using plupload's classes
	public function action_upload()
	{
		// Validate Logged in
		if (\Model_User::verify_session() !== true ) throw new HttpNotFoundException;

		Event::register('media-upload-complete', '\Controller_Media::on_upload_complete');

		Package::load('plupload');
		return \Plupload\Plupload::upload();
	}

	// Event handler called when an upload via plupload is complete
	public static function on_upload_complete($uploaded_file)
	{
		$asset = Materia\Widget_Asset_Manager::process_upload(Input::post('name', 'New Asset'), $uploaded_file);
		return $asset->id;
	}


	protected function _show_resized($asset_id, $size_name, $width, $crop=false)
	{
		// Validate Logged in
		if (\Model_User::verify_session() !== true ) throw new HttpNotFoundException;

		$asset = Materia\Widget_Asset_Manager::get_asset($asset_id);

		// Validate Asset exists
		if ( ! ($asset instanceof Materia\Widget_Asset)) throw new HttpNotFoundException;

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
