<?php

namespace Fuel\Migrations;

class Add_Context_Id_To_Log_Play_And_Extra_Attempts
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'context_id' => ['constraint' => 255, 'type' => 'varchar', 'default' => ''],
				'semester'   => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
			]
		);

		\DBUtil::add_fields(
			'user_extra_attempts',
			[
				'context_id' => ['constraint' => 255, 'type' => 'varchar', 'default' => ''],
				'semester'   => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', ['context_id', 'semester']);
		\DBUtil::drop_fields('user_extra_attempts', ['context_id', 'semester']);
	}
}
