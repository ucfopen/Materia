<?php

namespace Fuel\Migrations;

class Create_user_role
{
	public function up()
	{
		\DBUtil::create_table(
			'user_role',
			[
				'role_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'name'    => ['constraint' => 50, 'type' => 'varchar'],
			],
			['role_id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('user_role', 'name');
	}

	public function down()
	{
		\DBUtil::drop_table('user_role');
	}
}