<?php

class File extends Fuel\Core\File
{

	public static function render($path, $name = null, $mime = null, $area = null)
	{

		$info = static::file_info($path, $area);
		empty($mime) and $mime = $info['mimetype'];
		empty($name) and $name = $info['basename'];

		if ( ! $file = static::open_file(@fopen($info['realpath'], 'rb'), LOCK_SH, $area))
		{
			throw new \FileAccessException('Filename given could not be opened for download.');
		}

		header('Content-Type: '.$mime);
		header('Expires: '.date('D, d M Y H:i:s \G\M\T' , (time() + 43200)));
		header('Pragma: public');
		header('Cache-Control: max-age=172800, public, must-revalidate');

		// send the file using mod_xsendfile
		if (\Config::get('file.enable_mod_xsendfile', false) && in_array('mod_xsendfile', apache_get_modules()))
		{
			header('X-SendFile: '.$info['realpath']);
			exit;
		}

		// send the file by chunking it
		while (ob_get_level() > 0)
		{
			ob_end_clean();
		}

		// send the file using php
		ini_get('zlib.output_compression') and ini_set('zlib.output_compression', 0);
		! ini_get('safe_mode') and set_time_limit(0);

		header('Content-Length: '.$info['size']);
		header('Content-Transfer-Encoding: binary');

		while ( ! feof($file))
		{
			echo fread($file, 2048);
		}

		static::close_file($file, $area);
		exit;
	}
}
