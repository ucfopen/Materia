<?php

namespace Fuel\Migrations;

class Create_perm_object_to_user
{
	public function up()
	{
		\DBUtil::create_table(
			'perm_object_to_user',
			[
				'object_id'   => ['constraint' => 10, 'type' => 'varchar'],
				'user_id'     => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'perm'        => ['constraint' => 5, 'type' => 'tinyint'],
				'object_type' => ['constraint' => 5, 'type' => 'tinyint'],
				'expires_at'  => ['constraint' => 11, 'type' => 'int', 'null' => true],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('perm_object_to_user', ['object_id', 'user_id', 'perm', 'object_type'], null, 'UNIQUE');

		\DB::query('ALTER TABLE '.\DB::quote_table('perm_object_to_user')." CHANGE `object_id` `object_id` VARCHAR(10)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('perm_object_to_user');
	}
}