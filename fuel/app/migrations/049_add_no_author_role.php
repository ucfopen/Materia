<?php

namespace Fuel\Migrations;

class Add_no_author_role
{
	public function up()
	{
		\Materia\Perm_Manager::create_role('no_author');
	}

	public function down()
	{
		$users = \Materia\Perm_Manager::get_user_ids_with_role('no_author');
		\Materia\Perm_Manager::remove_users_from_roles($users, 'no_author');
	}
}
