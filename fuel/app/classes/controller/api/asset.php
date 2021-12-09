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
		trace('----------------------------------------------------------------');
		trace('Inside Controller_Api_Delete');
		trace('----------------------------------------------------------------');

		try
		{
			if (\Service_User::verify_session() !== true) return Msg::no_login();
			// Make sure the user making the DELETE request
			// owns the asset they are trying to 'delete'.

			$deleted = \DB::update('asset')
										->value('is_deleted', '1')
										->where('id', $id)
										->execute();

			$time = \DB::update('asset')
								->value('deleted_at', time())
								->where('id', $id)
								->execute();

			// return $this->response(200);
		}
		catch (\Exception $th)
		{
			trace('Error: In the deletion process');
			trace($th);
		}

		\DB::commit_transaction();
	}
}