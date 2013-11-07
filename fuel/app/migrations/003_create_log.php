<?php

namespace Fuel\Migrations;

class Create_log
{
	public function up()
	{
		\DBUtil::create_table(
			'log',
			[
				'id'         => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'play_id'    => ['constraint' => 100, 'type' => 'varchar'],
				'type'       => ['type' => 'enum', 'constraint' => "'BUTTON_PRESS', 'ERROR_GENERAL', 'ERROR_TIME_VALIDATION', 'KEY_PRESS', 'SCORE_ACTIVITY_FROM_CLIENT', 'SCORE_FINAL_FROM_CLIENT', 'SCORE_QUESTION_ANSWERED', 'SCORE_WIDGET_INTERACTION', 'WIDGET_CORE_INIT', 'WIDGET_END', 'WIDGET_LOAD_DONE', 'WIDGET_LOAD_START', 'WIDGET_LOGIN', 'WIDGET_PLAY_REQ', 'WIDGET_PLAY_START', 'WIDGET_RESTART', 'WIDGET_START', 'WIDGET_STATE', 'DATA'", 'null' => true],
				'item_id'    => ['constraint' => 255, 'type' => 'varchar'],
				'text'       => ['type' => 'mediumtext'],
				'value'      => ['constraint' => 255, 'type' => 'varchar'],
				'created_at' => ['constraint' => 11, 'type' => 'int', 'default' => '0'],
				'game_time'  => ['constraint' => 11, 'type' => 'int', 'default' => '0'],
				'visible'    => ['type' => 'enum', 'constraint' => "'0','1','2','3'", 'default' => '0'],
				'ip'         => ['constraint' => 20, 'type' => 'varchar'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('log', 'play_id');
		\DBUtil::create_index('log', 'type');
		\DBUtil::create_index('log', ['created_at']);

		\DB::query('ALTER TABLE '.\DB::quote_table('log')." CHANGE `play_id` `play_id` VARCHAR(100)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('log');
	}
}