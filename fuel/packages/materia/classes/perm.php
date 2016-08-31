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


/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  perms * @author      ADD NAME HERE
 */

namespace Materia;

abstract class Perm
{

	const ENABLE = true;

	const DISABLE = false;

	// Objects
	const INSTANCE = 0;
	const QUESTION = 1;
	const ASSET    = 2;
	const WIDGET   = 3;
	const DOCUMENT = 4;

	/** @const Can see Object */
	const VISIBLE = 0;
	/** @const Can play this Object (reserved for game access) */
	const PLAY    = 5;
	/** @const Can recieve a score for their play */
	const SCORE   = 10;
	/** @const Can see the game's logs */
	const DATA    = 15;
	/** @const Can edit the Object */
	const EDIT    = 20;
	/** @const Can copy the Object for own use */
	const COPY    = 25;
	/** @const Marked as an owner of the Object OWNERSHIP SIGNIFIES FULL ACCESS */
	const FULL    = 30;
	/** @const Has rights to share their rights with another user */
	const SHARE   = 35;

	/** @const Can give others visible rights */
	const GIVE_VISIBLE = 40;
	/** @const Can give others eidt rights */
	const GIVE_EIDT    = 45;
	/** @const Can give others copy rights */
	const GIVE_COPY    = 50;
	/** @const Can give others ownership rights */
	const GIVE_OWN     = 55;
	/** @const Can give others play ability */
	const GIVE_PLAY    = 60;
	/** @const Can give others score ability */
	const GIVE_SCORE   = 65;
	/** @const Can give others log data visability */
	const GIVE_DATA    = 70;
	/** @const Can give others share ability */
	const GIVE_SHARE   = 75;

	// group rights only
	/** @const Has rights to access manger interface */
	const AUTHORACCESS  = 80;
	/** @const Has rights to administer users */
	const ADMINISTRATOR = 85;
	/** @const Has super user rights to do anything */
	const SUPERUSER     = 90;
}
