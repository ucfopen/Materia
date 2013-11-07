<?php

namespace Fuel\Migrations;

class Create_user
{
	public function up()
	{
		\DBUtil::create_table(
			'users',
			[
				'id'             => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'username'       => ['constraint' => 50, 'type' => 'varchar'],
				'first'          => ['constraint' => 100, 'type' => 'varchar'],
				'last'           => ['constraint' => 100, 'type' => 'varchar'],
				'password'       => ['constraint' => 255, 'type' => 'varchar'],
				'group'          => ['constraint' => 11, 'type' => 'int', 'default' => 1],
				'email'          => ['constraint' => 255, 'type' => 'varchar'],
				'last_login'     => ['constraint' => 11, 'type' => 'int', 'default' => 0],
				'login_hash'     => ['constraint' => 255, 'type' => 'varchar'],
				'profile_fields' => ['type' => 'text'],
				'created_at'     => ['constraint' => 11, 'type' => 'int', 'unsigned' => true],
				'updated_at'     => ['constraint' => 11, 'type' => 'int', 'unsigned' => true],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('users', ['username', 'email']);

	}

	public function down()
	{
		\DBUtil::drop_table('users');
	}
}