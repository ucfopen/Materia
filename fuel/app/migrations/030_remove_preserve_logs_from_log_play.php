<?php

namespace Fuel\Migrations;

class Remove_preserve_logs_from_log_play
{
	public function up()
	{
		\DBUtil::drop_fields(
			'log_play',
			'preserve_logs'
		);
	}

	public function down()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'preserve_logs' => ['constraint' => "'0','1'", 'type' => 'enum'],
			]
		);
	}
}
