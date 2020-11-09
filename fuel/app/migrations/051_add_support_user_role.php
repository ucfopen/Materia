<?php

namespace Fuel\Migrations;

class Add_support_user_role
{
	public function up()
	{
		\Materia\Perm_Manager::create_role('support_user');
	}

	public function down()
	{
		$users = \Materia\Perm_Manager::get_user_ids_with_role('support_user');
		\Materia\Perm_Manager::remove_users_from_roles($users, 'support_user');
	}
}
