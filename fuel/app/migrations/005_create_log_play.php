<?php

namespace Fuel\Migrations;

class Create_log_play
{
	public function up()
	{
		\DBUtil::create_table(
			'log_play',
			[
				'id'             => ['constraint' => 100, 'type' => 'varchar'],
				'inst_id'        => ['constraint' => 10, 'type' => 'varchar'],
				'is_valid'       => ['type' => 'enum', 'constraint' => "'0','1'"],
				'created_at'     => ['constraint' => 11, 'type' => 'int'],
				'user_id'        => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'ip'             => ['constraint' => 20, 'type' => 'varchar'],
				'is_complete'    => ['constraint' => "'0','1'", 'type' => 'enum'],
				'score'          => ['constraint' => '52,2', 'type' => 'decimal'],
				'score_possible' => ['constraint' => 50, 'type' => 'int'],
				'percent'        => ['type' => 'double'],
				'elapsed'        => ['constraint' => 11, 'type' => 'int'],
				'preserve_logs'  => ['constraint' => "'0','1'", 'type' => 'enum'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('log_play', 'inst_id');
		\DBUtil::create_index('log_play', 'user_id');
		\DBUtil::create_index('log_play', 'percent');
		\DBUtil::create_index('log_play', 'is_complete');

		\DB::query('ALTER TABLE '.\DB::quote_table('log_play')." CHANGE `id` `id` VARCHAR(100)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
		\DB::query('ALTER TABLE '.\DB::quote_table('log_play')." CHANGE `inst_id` `inst_id` VARCHAR(10)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('log_play');
	}
}