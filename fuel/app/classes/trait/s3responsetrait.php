<?php

trait Trait_S3ResponseTrait
{
	protected function add_s3_config_to_response()
	{
		$s3_cfg = Config::get('materia.s3_config');
		$protocol = (\FUEL::$env == \FUEL::DEVELOPMENT) ? 'http://' : 'https://';

		$s3_enabled = $s3_cfg['s3_enabled'] === true;

		Js::push_inline('var S3_ENABLED = '.($s3_enabled ? 'true' : 'false').';');
		Js::push_inline('var MEDIA_URL = "'.Config::get('materia.urls.media').'";');
		Js::push_inline('var MEDIA_UPLOAD_URL = "'.Config::get('materia.urls.media_upload').'";');
	}
}
