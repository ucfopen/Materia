<?php
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
	static public function get_widgets($widget_ids=null, $type='featured')
	{
		$widgets = [];
		// =============== Get the requested widgets =================

		# blank list of ids basically says "grab all the widgets from the DB instead"
		if (empty($widget_ids))
		{
			$query = \DB::select('id')
				->from('widget')
				->order_by('name');

			# $type provides optional selection filter for widgets:
			# - default is only 'featured' widgets
			# - 'all' is all widgets installed in Materia
			# $type could potentially be extended to other options later on
			switch ($type)
			{
				case 'admin':
					// return everything
					break;

				case 'all':
				case 'playable':
					$query->where('is_playable', '1');
					break;

				case 'featured':
				case 'catalog':
				default:
					$query->where('in_catalog', '1');
					$query->where('is_playable', '1');
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

	static public function update_widget($props)
	{
		if ( ! \Materia\Perm_Manager::is_super_user() ) throw new \HttpNotFoundException;

		$widget = new Widget();
		$found = $widget->get($props->id);
		unset($props->id);

		//confirm that widget id and name are correct from the incoming request
		if ( ! $found) return ['widget' => 'Widget not found!'];
		if ($props->clean_name != $widget->clean_name) return ['widget' => 'Widget mismatch!'];

		unset($props->clean_name);

		//keep track of each thing we're potentially changing
		$report = [];

		$original_demo = $widget->meta_data['demo'];
		if ($original_demo == $props->demo)
		{
			$report['demo'] = true;
		}
		else
		{
			$demo = Widget_Instance_Manager::get($props->demo);
			if ($demo)
			{
				if ($demo->widget == $widget)
				{
					try
					{
						\DB::update('widget_metadata')
							->set(['value' => $demo->id])
							->where('widget_id', $widget->id)
							->where('name', 'demo')
							->execute();
						$report['demo'] = true;

						$activity = new Session_Activity([
							'user_id' => \Model_User::find_current_id(),
							'type'    => Session_Activity::TYPE_ADMIN_EDIT_WIDGET,
							'item_id' => $widget->id,
							'value_1' => 'demo',
							'value_2' => $original_demo,
							'value_3' => $demo->id,
						]);
						$activity->db_store();
					}
					catch (Exception $e)
					{
						$report['demo'] = '"Demo" update failed!';
					}
				}
				else
				{
					$report['demo'] = 'Demo instance is for another widget!';
				}
			}
			else
			{
				$report['demo'] = 'Demo instance not found!';
			}
		}
		unset($props->demo);

		foreach ($props as $prop => $val)
		{
			$clean_prop = ucwords(str_replace('_', ' ', $prop));
			$result = $widget->set_property($prop, $val);
			$report[$prop] = $result ? true : '"'.$clean_prop.'" update failed!';
		}

		return $report;
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
