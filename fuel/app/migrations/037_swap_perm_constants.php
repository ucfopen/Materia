<?php

namespace Fuel\Migrations;

class Swap_Perm_Constants
{
	public function up()
	{
		\DB::update('perm_object_to_user')
			->value('object_type', \Materia\Perm::INSTANCE)
			->where('object_type', 0)
			->execute();
		\DB::update('perm_object_to_user')
			->value('perm', \Materia\Perm::VISIBLE)
			->where('perm', 0)
			->execute();
		\DB::update('perm_role_to_perm')
			->value('perm', \Materia\Perm::VISIBLE)
			->where('perm', 0)
			->execute();
	}

	public function down()
	{
		\DB::update('perm_object_to_user')
			->value('object_type', 0)
			->where('object_type', \Materia\Perm::INSTANCE)
			->execute();
		\DB::update('perm_object_to_user')
			->value('perm', 0)
			->where('perm', \Materia\Perm::VISIBLE)
			->execute();
		\DB::update('perm_role_to_perm')
			->value('perm', 0)
			->where('perm', \Materia\Perm::VISIBLE)
			->execute();
	}
}
