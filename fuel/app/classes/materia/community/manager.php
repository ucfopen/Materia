<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */

namespace Materia;

class Community_Manager
{

	/**
	 * @todo MUST VALIDATE INPUT MORE!!!!!!!
	 * @todo SEPERATE 'all' into another function
	 */
	static public function get_project($project)
	{
		if ($project == 'all')
		{
			$return = \DB::select('name')
				->from('project')
				->as_object()
				->execute()
				->as_array();
		}
		else
		{
			$widgets = [];
			$return = [];

			$project_key = preg_match('/^[0-9]*$/', $project) ? 'id' : 'name';

			// @TODO: this should be one query
			$projects = \DB::select()
				->from('project')
				->where($project_key, $project)
				->as_object()
				->execute();

			$widgets = \DB::select('widget_id')
				->from('widget_metadata')
				->where('name', 'project')
				->where('value', $projects[0]->name)
				->as_object()
				->execute()
				->as_array();

			$return['project'] = $projects[0];
			$return['widgets'] = $widgets;
		}
		return $return;
	}
}
