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
 * High-level user activity logging.
 *
 * @package	   Materia
 * @subpackage Session  @author Corey Peterson
 */

namespace Materia;

class Session_Activity
{
		// Activity Types
		const TYPE_CREATE_WIDGET            = 'createdWidget';
		const TYPE_DELETE_WIDGET            = 'deletedWidget';
		const TYPE_RESTORE_WIDGET           = 'restoredWidget';
		const TYPE_EDIT_WIDGET              = 'editedWidget';
		const TYPE_EDIT_WIDGET_SETTINGS     = 'editedWidgetSettings';
		const TYPE_LOGGED_IN                = 'loggedIn';
		const TYPE_LOGGED_OUT               = 'loggedOut';

		public $created_at = 0;
		public $id         = 0;
		public $item_id    = 0;
		public $type       = '';
		public $user_id    = 0;
		public $value_1    = '';
		public $value_2    = '';
		public $value_3    = '';

		public function __construct($properties=[])
		{
			if ( ! empty($properties))
			{
				foreach ($properties as $key => $val)
				{
					if (property_exists($this, $key)) $this->{$key} = $val;
				}
				if ($this->created_at == 0) $this->created_at = date('U');
			}
		}

		public function db_store()
		{
			if (isset($this->type) && isset($this->user_id) && isset($this->created_at))
			{
				list($id, $num) = \DB::insert('log_activity')
					->set( (array) $this)
					->execute();

				if ($num > 0)
				{
					$this->id = $id;
					return true;
				}
				return false;
			}
		}
}
