<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Api_Asset extends Controller_Rest
{
	protected $_supported_formats = ['json' => 'application/json'];

	public function delete_delete($id)
	{
		\DB::start_transaction();

		try
		{
			if (\Service_User::verify_session() !== true) return Msg::no_login();

		$asset = \DB::update('asset')
							->value('deleted_at', time())
							->value('is_deleted', '1')
							->where('id', $id)
							->execute();
		}
		catch (\Exception $th)
		{
			trace('Error: In the deletion process');
			trace($th);
		}

		\DB::commit_transaction();
	}

	public function delete_restore($id)
	{
		\DB::start_transaction();

		try
		{
			if (\Service_User::verify_session() !== true) return Msg::no_login();

			\DB::update('asset')
				->value('deleted_at', '-1')
				->value('is_deleted', '0')
				->where('id', $id)
				->execute();
		}
		catch (\Exception $th)
		{
			trace('Error: In the deletion process');
			trace($th);
		}

		\DB::commit_transaction();
	}
}