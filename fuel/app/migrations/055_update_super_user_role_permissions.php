<?php

namespace Fuel\Migrations;

class Update_super_user_role_permissions
{
	public function up()
	{
		$super_user_role_id = \Materia\Perm_Manager::get_role_id('super_user');

		\DB::QUERY('UPDATE `perm_role_to_perm` SET `perm` = :new_perm WHERE `role_id` = :role_id AND `perm` = :old_perm')
			->param('role_id', $super_user_role_id)
			->param('old_perm', \Materia\Perm::BASICAUTHOR) // the OLD permission level (80)
			->param('new_perm', \Materia\Perm::SUPERUSER)   // the NEW permission level (90)
			->execute();
	}

	public function down()
	{
		$super_user_role_id = \Materia\Perm_Manager::get_role_id('super_user');

		\DB::QUERY('UPDATE `perm_role_to_perm` SET `perm` = :old_perm WHERE `role_id` = :role_id AND `perm` = :new_perm')
			->param('role_id', $super_user_role_id)
			->param('old_perm', \Materia\Perm::BASICAUTHOR)
			->param('new_perm', \Materia\Perm::SUPERUSER)
			->execute();
	}
}
