<?php
/**
 * Materia
 * License outlined in licenses folder
 */

use \Materia\Perm;
use \Materia\Perm_Manager;

class Controller_Api_Asset extends Controller_Rest
{

	public function delete_delete($asset_id)
	{
		$user_id = \Model_User::find_current_id();

		if (\Service_User::verify_session() !== true) return Msg::no_login();

		if ( ! Perm_Manager::user_has_any_perm_to($user_id, $asset_id, Perm::ASSET, Perm::FULL))
			return new Response('You don not have access to this asset', 401);

		try
		{
			\DB::update('asset')
				->value('deleted_at', time())
				->value('is_deleted', '1')
				->where('id', $asset_id)
				->execute();
		}
		catch (\Exception $th)
		{
			trace('Error: In the deletion process');
			trace($th);
		}
	}

	public function delete_restore($asset_id)
	{
		$user_id = \Model_User::find_current_id();
		if (\Service_User::verify_session() !== true) return Msg::no_login();

		if ( ! Perm_Manager::user_has_any_perm_to($user_id, $asset_id, Perm::ASSET, Perm::FULL))
			return new Response('You don not have access to this asset', 401);

		try
		{
			\DB::update('asset')
				->value('deleted_at', '-1')
				->value('is_deleted', '0')
				->where('id', $asset_id)
				->execute();
		}
		catch (\Exception $th)
		{
			trace('Error: In the deletion process');
			trace($th);
		}
	}
}