<?php

namespace Fuel\Migrations;

class Create_log_activity
{
	public function up()
	{
		\DBUtil::create_table(
			'log_activity',
			[
				'id'         => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'user_id'    => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'type'       => ['type' => 'enum', 'constraint' => "'loggedIn','loggedOut','createdWidget','editedWidget','deletedWidget'"],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
				'item_id'    => ['constraint' => 100, 'type' => 'varchar'],
				'value_1'    => ['constraint' => 255, 'type' => 'varchar', 'null' => true],
				'value_2'    => ['constraint' => 255, 'type' => 'varchar', 'null' => true],
				'value_3'    => ['constraint' => 255, 'type' => 'varchar', 'null' => true],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('log_activity', 'user_id');
		\DBUtil::create_index('log_activity', 'type');
		\DBUtil::create_index('log_activity', 'item_id');
		\DBUtil::create_index('log_activity', 'created_at');

		\DB::query('ALTER TABLE '.\DB::quote_table('log_activity')." CHANGE `item_id` `item_id` VARCHAR(100)  COLLATE utf8_bin  NOT NULL DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('log_activity');
	}
}