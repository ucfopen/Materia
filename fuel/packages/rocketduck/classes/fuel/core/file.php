<?php

class File extends Fuel\Core\File
{

	public static function render($path, $name = null, $mime = null, $area = null)
	{
		$sendfile = false;

		// send file using apache's mod_xsendfile?
		if (\Config::get('file.enable_mod_xsendfile', false) && function_exists('apache_get_modules') && in_array('mod_xsendfile', apache_get_modules()))
		{
			$sendfile = true;
			$sendfile_header = 'X-SendFile: '.$info['realpath'];
		}

		// send file using nginx's x_accel?
		if (\Config::get('file.enable_x_accel', false))
		{
			$sendfile = true;
			$area_basepath = \Config::get("file.areas.{$area}.basedir");
			$area_xaccel = \Config::get("file.areas.{$area}.xaccell_basepath");
			$sub_path = str_replace(realpath($area_basepath), '', realpath($path)); // get the path under the base path down
			$sendfile_header = "X-Accel-Redirect: {$area_xaccel}{$sub_path}";
		}

		// Hand off file retrevial to the webserver
		if ($sendfile)
		{
			$info = static::file_info(realpath($path), $area);
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
			header($sendfile_header);
			exit;
		}

		// chunk the file using php
		static::download($path, $name, $mime, $area, false, $disposition = 'inline');

	}
}
