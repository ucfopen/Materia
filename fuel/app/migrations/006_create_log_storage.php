<?php

namespace Fuel\Migrations;

class Create_log_storage
{
	public function up()
	{
		\DBUtil::create_table(
			'log_storage',
			[
				'inst_id'    => ['constraint' => 10, 'type' => 'varchar'],
				'play_id'    => ['constraint' => 100, 'type' => 'varchar'],
				'user_id'    => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'created_at' => ['constraint' => 11, 'type' => 'int', 'unsigned' => true],
				'name'       => ['constraint' => 64, 'type' => 'varchar'],
				'data'       => ['type' => 'longblob'],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('log_storage', 'inst_id');
		\DBUtil::create_index('log_storage', 'play_id');
		\DBUtil::create_index('log_storage', 'user_id');
		\DBUtil::create_index('log_storage', 'created_at');
		\DBUtil::create_index('log_storage', 'name');

		\DB::query('ALTER TABLE '.\DB::quote_table('log_storage')." CHANGE `play_id` `play_id` VARCHAR(100) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();
		\DB::query('ALTER TABLE '.\DB::quote_table('log_storage')." CHANGE `inst_id` `inst_id` VARCHAR(10) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('log_storage');
	}
}