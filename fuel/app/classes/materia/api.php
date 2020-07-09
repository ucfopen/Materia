<?php
namespace Materia;

class Api extends Api_V1
{
	static public function get_version($version)
	{
		$class = '\Materia\Api';
		if (is_numeric($version)) $class .= "_V$version";
		return new $class;
	}

}
