<?php

namespace Fuel\Migrations;

class Add_support_user_role_perms
{
	public function up()
	{
		$support_role_id = \Materia\Perm_Manager::get_role_id('support_user');

		// check to see if support_user already has Perm::FULL
		$pre_q = \DB::select('role_id','perm')
			->from('perm_role_to_perm')
			->where('role_id', $support_role_id)
			->where('perm', \Materia\Perm::FULL)
			->execute();
		
		// if not, grant support_user Perm::FULL
		if ($pre_q->count() == 0) {
			$q = \DB::query('INSERT INTO `perm_role_to_perm` (`role_id`, `perm`) values (:role_id, :perm) ON DUPLICATE KEY UPDATE `role_id` = :role_id, `perm` = :perm');
			$q->param('role_id', $support_role_id);
			$q->param('perm', \Materia\Perm::FULL);
			$q->execute();
		}

		// now check to see if support_user already has Perm::SUPPORTUSER
		$pre_q = \DB::select('role_id','perm')
			->from('perm_role_to_perm')
			->where('role_id', $support_role_id)
			->where('perm', \Materia\Perm::SUPPORTUSER)
			->execute();

		// if not, grant support_user Perm::SUPPORTUSER
		if ($pre_q->count() == 0) {
			$q = \DB::query('INSERT INTO `perm_role_to_perm` (`role_id`, `perm`) values (:role_id, :perm) ON DUPLICATE KEY UPDATE `role_id` = :role_id, `perm` = :perm');
			$q->param('role_id', $support_role_id);
			$q->param('perm', \Materia\Perm::SUPPORTUSER);
			$q->execute();
		}
	}

	public function down()
	{
		$support_role_id = \Materia\Perm_Manager::get_role_id('support_user');

		\DB::delete('perm_role_to_perm')
			->where('role_id', 'like', $support_role_id)
			->execute();
	}
}
