<?php

trait Lib_S3ResponseTrait
{
	protected function add_s3_config_to_response()
	{
		$s3_cfg = Config::get('materia.s3_config');
		$protocol = (\FUEL::$env == \FUEL::DEVELOPMENT) ? 'http://' : 'https://';

		$s3_enabled = $s3_cfg['s3_enabled'];
		$s3_media_url = "{$protocol}{$s3_cfg['uploads_bucket']}.{$s3_cfg['upload_url']}";
		$local_media_url = Uri::base().Config::get('materia.urls.media');
		$local_upload_url = Uri::base().Config::get('materia.urls.media_upload');

		// If using two buckets, upload to the second bucket defined as verified_bucket in config
		$s3_thumbnail_url = ($s3_cfg['verified_bucket']) ? $protocol.$s3_cfg['verified_bucket'].'.'.$s3_cfg['upload_url'] : $s3_media_url;

		Js::push_inline('var S3_ENABLED = '.($s3_enabled ? 'true' : 'false').';');
		Js::push_inline('var MEDIA_URL = "'.($s3_enabled ? $s3_media_url : $local_media_url).'";');
		Js::push_inline('var MEDIA_UPLOAD_URL = "'.($s3_enabled ? $s3_media_url : $local_upload_url).'";');

		// for thumbnail retrieval
		Js::push_inline('var MEDIA_THUMBNAIL_URL = "'.($s3_enabled ? $s3_thumbnail_url : $local_media_url).'";');
	}
}
