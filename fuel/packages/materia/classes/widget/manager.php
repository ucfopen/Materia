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
			$query = \DB::select('id')
				->from('widget')
				->where('is_playable', '1')
				->order_by('name');

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
					$query->where('in_catalog', '1');
					break;
			}

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

	static public function get_all_widgets()
	{
		$widgets = [];

		$query = \DB::select('id')
			->from('widget')
			->order_by('name')
			->execute();

		$widget_ids = \Arr::flatten($query);

		foreach ($widget_ids as $widget_id)
		{
			$widget = new Widget();
			$widget->get($widget_id);
			$widgets[] = $widget;
		}

		return $widgets;
	}

	static public function update_widget($props)
	{
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) throw new HttpNotFoundException;

		$widget = new Widget();
		$widget->get($props->id);

		if(empty($widget)) return false;

		\DB::update('widget_metadata')
			->set(['value' => $props->about])
			->where('widget_id', $widget->id)
			->where('name', 'about')
			->execute();
		\DB::update('widget_metadata')
			->set(['value' => $props->excerpt])
			->where('widget_id', $widget->id)
			->where('name', 'excerpt')
			->execute();

		$demo = Widget_Instance_Manager::get($props->demo);
		if($demo)
		{
			\DB::update('widget_metadata')
				->set(['value' => $demo->id])
				->where('widget_id', $widget->id)
				->where('name', 'demo')
				->execute();
		}

		\DB::update('widget')
			->set([
				'in_catalog' => $props->in_catalog,
				'is_editable' => $props->is_editable,
				'is_playable' => $props->is_playable,
				'is_scorable' => $props->is_scorable
				])
			->where('id', $widget->id)
			->limit(1)
			->execute();

		return true;
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