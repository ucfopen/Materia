<?php
/**
 * Materia
 * License outlined in licenses folder
 */

use \Materia\Msg;
use \Materia\Perm;
use \Materia\Perm_Manager;

class Controller_Api_Asset extends Controller_Rest
{

	public function post_delete($asset_id)
	{
		$user_id = \Model_User::find_current_id();
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		if ( ! Perm_Manager::user_has_any_perm_to($user_id, $asset_id, Perm::ASSET, Perm::FULL))
			return new Response('You do not have access to this asset', 401);

		try
		{
			\DB::update('asset')
				->value('deleted_at', time())
				->value('is_deleted', '1')
				->where('id', $asset_id)
				->execute();

			return true;
		}
		catch (\Exception $th)
		{
			\Log::error('Error: In the deletion process');
			\Log::error($th);

			return new Msg(Msg::ERROR, 'Asset could not be deleted.');
		}
	}

	public function post_restore($asset_id)
	{
		$user_id = \Model_User::find_current_id();
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		if ( ! Perm_Manager::user_has_any_perm_to($user_id, $asset_id, Perm::ASSET, Perm::FULL))
			return new Response('You do not have access to this asset', 401);

		try
		{
			\DB::update('asset')
				->value('deleted_at', '-1')
				->value('is_deleted', '0')
				->where('id', $asset_id)
				->execute();

			return true;
		}
		catch (\Exception $th)
		{
			\Log::error('Error: In the deletion process');
			\Log::error($th);

			return new Msg(Msg::ERROR, 'Asset could not be restored.');
		}
	}
}