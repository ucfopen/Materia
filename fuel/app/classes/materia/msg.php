<?php
/**
 * Rocket Duck
 * It's a thing
 *
 * @package	    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  com * @author      ADD NAME HERE
 */

namespace Materia;

class Msg
{

	const ERROR  = 'error';
	const NOTICE = 'notice';
	const WARN   = 'warn';

	public $halt;
	public $msg;
	public $payload;
	public $title;
	public $type;

	public function __construct($msg, $title='', $type='error', $halt=false)
	{
		$this->type  = $type;
		$this->title = $title;
		$this->msg   = $msg;
		$this->halt  = $halt;
	}

	static public function invalid_input($msg='')
	{
		return new Msg($msg, 'Validation Error', Msg::ERROR, true);
	}

	static public function no_login()
	{
		$msg = new Msg('You have been logged out, and must login again to continue', 'Invalid Login', Msg::ERROR, true);
		\Session::set_flash('login_error', $msg->msg);
		return $msg;
	}

	static public function no_perm()
	{
		return new Msg('You do not have permission to access the requested content', 'Permission Denied', Msg::WARN);
	}

	static public function student()
	{
		return new Msg('Students are unable to receive notifications via Materia', 'No Notifications', Msg::NOTICE);
	}
}
