<?php

namespace Fuel\Migrations;

class Create_user_extra_attempts
{
	public function up()
	{
		\DBUtil::create_table(
			'user_extra_attempts',
			[
				'id' => ['constraint' => 11, 'type' => 'int', 'auto_increment' => true, 'unsigned' => true],
				'inst_id' => ['constraint' => 10, 'type' => 'varchar'],
				'user_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
				'extra_attempts' => ['constraint' => 2, 'type' => 'int'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('user_extra_attempts', 'inst_id');
		\DBUtil::create_index('user_extra_attempts', 'user_id');
	}

	public function down()
	{
		\DBUtil::drop_table('user_extra_attempts');
	}
}