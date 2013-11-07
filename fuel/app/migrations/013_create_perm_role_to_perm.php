<?php

namespace Fuel\Migrations;

class Create_perm_role_to_perm
{
	public function up()
	{
		\DBUtil::create_table(
			'perm_role_to_perm',
			[
				'role_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'perm'    => ['constraint' => 5, 'type' => 'tinyint', 'unsigned' => true],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('perm_role_to_perm', ['role_id', 'perm']);

	}

	public function down()
	{
		\DBUtil::drop_table('perm_role_to_perm');
	}
}