<?php

namespace Fuel\Migrations;

class Add_support_user_role_perms
{
	public function up()
	{
		$support_role_id = \Materia\Perm_Manager::get_role_id('support_user');

		$q = \DB::query('INSERT INTO `perm_role_to_perm` SET `role_id` = :role_id, `perm` = :perm ON DUPLICATE KEY UPDATE `perm` = :perm');
		$q->param('role_id', $support_role_id);
		$q->param('perm', \Materia\Perm::FULL);
		$q->execute();

		$q->param('role_id', $support_role_id);
		$q->param('perm', \Materia\Perm::SUPPORTUSER);
		$q->execute();
	}

	public function down()
	{
		$support_role_id = \Materia\Perm_Manager::get_role_id('support_user');

		\DB::delete('perm_role_to_perm')
			->where('role_id', 'like', $support_role_id)
			->execute();
	}
}
