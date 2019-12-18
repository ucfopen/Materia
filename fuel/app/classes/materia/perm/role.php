<?php
/**
 * Materia
 *
 * It's a thing
 *
 * @package    Materia
 * @version    1.0
 * @author     UCF New Media
 * @copyright  2011 New Media
 * @link       http://kogneato.com
 */


/**
 * This is the class that defines the Role data type
 *
 * This is the class that defines the Role data type.
 * It is used simply for representing data in memory, and has no methods.
 *
 * @package	    Core
 * @subpackage  perms
 */

namespace Materia;

class Perm_Role
{

	const AUTHOR = 'basic_author';
	const SU     = 'super_user';
	const NOAUTH = 'no_author';

	//role IDs
	// TODO: can't count on these being correct
	const ROLE_AUTHOR = 1;
	const ROLE_SU     = 2;
	const ROLE_NOAUTH = 3;

	public $id;
	public $name;

	function __construct($id = 0, $name = '')
	{
		$this->id = $id;
		$this->name = $name;
	}
}
