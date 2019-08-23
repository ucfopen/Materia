<?php

use \Materia\Perm;
use \Materia\Perm_Manager;

class Controller_Data extends Controller
{

	/**
	 * @param $formexport_typeat String representing the custom export method to call
	 */
	public function get_export($inst_id)
	{
		if (\Service_User::verify_session() !== true) return new Response('', 401);
		$export_type  = Input::get('type');
		$semester_ids = Input::get('semesters', '');

		if (empty($export_type)) return new Response('', 400);

		$user_id = \Model_User::find_current_id();
		if ( ! Perm_Manager::user_has_any_perm_to($user_id, $inst_id, Perm::INSTANCE, [Perm::VISIBLE, Perm::FULL]) && ! \Service_User::verify_session(\Materia\Perm_Role::SU))
		{
			return new Response('', 403);
		}

		$inst = Materia\Widget_Instance_Manager::get($inst_id);

		try
		{
			$play_data = new \Materia\Session_PlayDataExporter($inst);
			list($data, $file_type) = $play_data->export($export_type, $semester_ids);
		}
		catch (\Exception $e)
		{
			trace("Error building data export: {$e->getMessage()} {$e->getFile()} {$e->getLine()}" );
			throw new HttpServerErrorException;
		}

		$title = \Inflector::friendly_title($inst->name, '_', true);
		return Response::forge()
			->body($data)
			->set_header('Pragma', 'public')
			->set_header('Expires', '0')
			->set_header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
			->set_header('Content-Type', 'application/force-download')
			->set_header('Content-Type', 'application/octet-stream')
			->set_header('Content-Type', 'application/download')
			->set_header('Content-Disposition', "attachment; filename=\"export_{$title}{$file_type}\"");
	}
}
