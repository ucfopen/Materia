<?php

namespace Fuel\Migrations;

class Create_perm_role_to_user
{
	public function up()
	{
		\DBUtil::create_table(
			'perm_role_to_user',
			[
				'user_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'role_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('perm_role_to_user', ['user_id', 'role_id'], null, 'UNIQUE');
	}

	public function down()
	{
		\DBUtil::drop_table('perm_role_to_user');
	}

}