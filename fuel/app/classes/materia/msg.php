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

	static public function invalid_input($msg = '', $title = 'Validation Error')
	{
		$msg = new Msg($msg, $title, Msg::ERROR, true);
		return new \Response(json_encode($msg), 403);
	}

	static public function no_login()
	{
		$msg = new Msg('You have been logged out, and must login again to continue', 'Invalid Login', Msg::ERROR, true);
		\Session::set_flash('login_error', $msg->msg);
		return new \Response(json_encode($msg), 403);
	}

	static public function no_perm($msg = 'You do not have permission to access the requested content', $title = 'Permission Denied')
	{
		$msg = new Msg($msg, $title, Msg::WARN);
		return new \Response(json_encode($msg), 401);
	}

	static public function student_collab()
	{
		$msg = new Msg('Students cannot be added as collaborators to widgets that have guest access disabled.', 'Share Not Allowed', Msg::ERROR);
		return new \Response(json_encode($msg), 401);
	}

	static public function student()
	{
		$msg = new Msg('Students are unable to receive notifications via Materia', 'No Notifications', Msg::NOTICE);
		return new \Response(json_encode($msg), 403);
	}

	static public function failure($msg = 'The requested action could not be completed', $title = 'Action Failed')
	{
		$msg = new Msg($msg, $title, Msg::ERROR);
		return new \Response(json_encode($msg), 403);
	}

	static public function not_found($msg = 'The requested content could not be found', $title = 'Not Found')
	{
		$msg = new Msg($msg, $title, Msg::ERROR);
		return new \Response(json_encode($msg), 404);
	}
}
