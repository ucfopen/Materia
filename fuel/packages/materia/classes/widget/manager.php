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
 * The go between for the user and the Materia Package.
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */

namespace Materia;

class Widget_Manager
{

	/**
	 * Finds the widget(s) based on the widget_ids
	 *
	 * @param $widget_ids array The widget_ids that are needed to be looked up.
	 * @param $type a default filter for the type of widgets to lookup. Default is only widgets where in_catalog = 1.
	 *
	 * @return array The information and metadata about the widget or widgets called for.
	 */
	static public function get_widgets($widget_ids, $type=null)
	{
		$widgets = [];
		// =============== Get the requested widgets =================

		# blank list of ids basically says "grab all the widgets from the DB instead"
		if (empty($widget_ids))
		{
			$query = 'SELECT `id` FROM `widget` WHERE `is_playable` = "1" ';

			# $type provides optional selection filter for widgets:
			# - default is only 'featured' widgets
			# - 'all' is all widgets installed in Materia
			# $type could potentially be extended to other options later on
			switch ($type)
			{
				case 'all':
					// No additional parameters to add to query
					break;

				default:
					$query .= 'AND `in_catalog` = "1" ';
					break;
			}

			$query .= 'ORDER BY `name`';

			$result = \DB::query($query)->execute();

			$widget_ids = \Arr::flatten($result);
		}

		foreach ($widget_ids as $widget_id)
		{
			$widget = new Widget();
			$widget->get($widget_id);
			$widgets[] = $widget;
		}

		return $widgets;
	}

	static public function search($name)
	{
		$widget_ids = \DB::select('id')
			->from('widget')
			->where('name', 'LIKE', '%'.$name.'%')
			->execute()
			->as_array('id');

		return self::get_widgets(array_keys($widget_ids));
	}

}