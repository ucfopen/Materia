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

class Session_Logger
{

	static public function parse_and_store_log_array($play_id, $logs)
	{
		if (\Materia\Util_Validator::is_valid_long_hash($play_id)) // valid pid & not a preview
		{
			if (is_array($logs) && count($logs) > 0)
			{
				$time = time();
				foreach ($logs as $log)
				{
					// define the defaults
					$type      = isset($log['type']) ? $log['type'] : 0;
					$item_id   = isset($log['item_id']) ? $log['item_id'] : 0;
					$text      = isset($log['text']) ? $log['text'] : '';
					$value     = isset($log['value']) ? $log['value'] : '';
					$game_time = isset($log['game_time']) ? $log['game_time'] : '';

					static::add_log($play_id, static::get_type($type), $item_id, $text, $value, $game_time, $time);
				}
			}
			else
			{
				trace('no logs sent');
			}
		}
		else
		{
			trace('Incorrect playid');
		}
	}

	static public function add_log($play_id=0, $type, $item_id, $text, $value, $game_time, $created_at)
	{
		$log = new Session_Log([
			'play_id'    => $play_id,
			'type'       => $type,
			'item_id'    => $item_id,
			'text'       => $text,
			'value'      => $value,
			'game_time'  => $game_time,
			'created_at' => $created_at
		]);

		if (\Materia\Util_Validator::is_valid_long_hash($play_id)) // valid pid & not a preview
		{
			$log->db_store();
		}
		return $log;
	}

	static public function get_type($type)
	{
		switch ((int)$type)
		{
			case 1:
				return Session_Log::TYPE_WIDGET_START;

			case 2:
				return Session_Log::TYPE_WIDGET_END;

			case 4:
				return Session_Log::TYPE_WIDGET_RESTART;

			case 5:
				return Session_Log::TYPE_ASSET_LOADING;

			case 6:
				return Session_Log::TYPE_ASSET_LOADED;

			case 7:
				return Session_Log::TYPE_FRAMEWORK_INIT;

			case 8:
				return Session_Log::TYPE_PLAY_REQUEST;

			case 9:
				return Session_Log::TYPE_PLAY_CREATED;

			case 13:
				return Session_Log::TYPE_LOG_IN;

			case 15:
				return Session_Log::TYPE_WIDGET_STATE_CHANGE;

			case 500:
				return Session_Log::TYPE_KEY_PRESS;

			case 1000:
				return Session_Log::TYPE_BUTTON_PRESS;

			case 1001:
				return Session_Log::TYPE_WIDGET_INTERACTION;

			case 1002:
				return Session_Log::TYPE_FINAL_SCORE_FROM_CLIENT;

			case 1004:
				return Session_Log::TYPE_QUESTION_ANSWERED;

			case 1006:
				return Session_Log::TYPE_SCORE_PARTICIPATION;

			case 1008:
				return Session_Log::TYPE_SCORE_FEEDBACK;

			case 1009:
				return Session_Log::TYPE_SCORE_ALERT;

			case 1500:
				return Session_Log::TYPE_GENERAL_ERROR;

			case 1509:
				return Session_Log::TYPE_TIME_VALIDATION_FAILURE;

			case 2000:
				return Session_Log::TYPE_DATA;

			default:
				return null;
		}
	}

	static public function get_logs($play_id)
	{
		// valid pid & not a preview
		if (\Materia\Util_Validator::is_valid_long_hash($play_id))
		{
			$results = \DB::select()
				->from('log')
				->where('play_id', $play_id)
				->order_by('id')
				->execute();

			$logs = [];
			foreach ($results as $r)
			{
				$logs[] = new Session_Log($r);
			}
			return $logs;
		}
		return [];
	}

	static public function query_logs($instance_id, $where_conditions, $order_conditions = null, $group_conditions = null)
	{
		//omit fields which could be traced to identify students
		$query = \DB::select('log.id', 'log.type', 'log.item_id', 'log.text', 'log.value', 'log.created_at', 'log.game_time', 'log.visible')
			->from('log')
			->join('log_play')
				->on('log.play_id', '=', 'log_play.id')
			->where('log_play.inst_id', $instance_id); //make sure we only get logs relevant to the current instance
		foreach ($where_conditions as $where_condition)
		{
			list($where_key, $where_comparison, $where_value) = $where_condition;
			$query->where('log.'.$where_key, $where_comparison, $where_value);
		}

		if ($group_conditions)
		{
			foreach ($group_conditions as $group_condition)
			{
				$query->group_by('log.'.$group_condition);
			}
		}
		if ($order_conditions)
		{
			foreach ($order_conditions as $order_condition)
			{
				$query->order_by('log.'.$order_condition);
			}
		}
		return $query->execute();
	}
}
