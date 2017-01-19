<?php
/**
 * Materia
 * It's a thing
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */
namespace Materia;

class Api extends Api_V1
{
	static public function get_version($version)
	{
		$class = '\Materia\Api';
		$class .= is_numeric($version) ? "_V$version" : "_$version";
		return new $class;
	}
}
