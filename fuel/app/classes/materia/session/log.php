<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  logging * @author      ADD NAME HERE
 */

namespace Materia;

class Session_Log
{

	/* System Events */
	const TYPE_ASSET_LOADED            = 'WIDGET_LOAD_DONE';
	const TYPE_ASSET_LOADING           = 'WIDGET_LOAD_START';
	const TYPE_FRAMEWORK_INIT          = 'WIDGET_CORE_INIT';
	const TYPE_LOG_IN                  = 'WIDGET_LOGIN';
	const TYPE_PLAY_CREATED            = 'WIDGET_PLAY_START';
	const TYPE_PLAY_REQUEST            = 'WIDGET_PLAY_REQ';
	const TYPE_WIDGET_END              = 'WIDGET_END';
	const TYPE_WIDGET_RESTART          = 'WIDGET_RESTART';
	const TYPE_WIDGET_START            = 'WIDGET_START';
	const TYPE_WIDGET_STATE_CHANGE     = 'WIDGET_STATE';

	/* In-Widget User Events */
	const TYPE_BUTTON_PRESS            = 'BUTTON_PRESS';
	const TYPE_KEY_PRESS               = 'KEY_PRESS';

	/* Scoring and Reporting */
	const TYPE_WIDGET_INTERACTION	   = 'SCORE_WIDGET_INTERACTION';
	const TYPE_FINAL_SCORE_FROM_CLIENT = 'SCORE_FINAL_FROM_CLIENT';
	const TYPE_QUESTION_ANSWERED	   = 'SCORE_QUESTION_ANSWERED';
	const TYPE_SCORE_ALERT             = 'SCORE_ALERT';
	const TYPE_SCORE_FEEDBACK          = 'SCORE_FEEDBACK';
	const TYPE_SCORE_SET_QUESTION      = 'SCORE_SET_QUESTION';
	const TYPE_SCORE_PARTICIPATION     = 'SCORE_PARTICIPATION';

	/* Errors */
	const TYPE_GENERAL_ERROR           = 'ERROR_GENERAL';
	const TYPE_TIME_VALIDATION_FAILURE = 'ERROR_TIME_VALIDATION';

	/* Catch all  */
	const TYPE_DATA                    = 'DATA';

	public $game_time  = 0;
	public $id         = 0;
	public $ip         = '';
	public $item_id    = 0;
	public $play_id    = 0;
	public $created_at = 0;
	public $text       = '';
	public $type       = '';
	public $value      = '';

	public function __construct($properties=[])
	{

		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
			if ($this->created_at < 1) $this->created_at = time();
			if ($this->ip == '' ) $this->ip = $_SERVER['REMOTE_ADDR'];
		}
	}
	/**
	 * Adds answer to the database
	 *
	 * @param object The Database Manager
	 */
	public function db_store()
	{
		if (\Materia\Util_Validator::is_valid_long_hash($this->play_id) && isset($this->type) && isset($this->created_at))
		{
			list($id, $num) = \DB::insert('log')
				->set([
					'play_id'    => $this->play_id,
					'type'       => $this->type,
					'item_id'    => $this->item_id,
					'text'       => $this->text,
					'value'      => isset($this->value) ? $this->value : '',
					'created_at' => $this->created_at,
					'game_time'  => $this->game_time,
					'ip'         => $this->ip
				])
				->execute();

			$this->id = $id;
			return $num > 0;
		}
		return false;
	}
	/**
	 * Perminantly remove from database
	 *
	 * @param object The Database Manager
	 */
	public function db_remove()
	{
		return false;
	}
}
