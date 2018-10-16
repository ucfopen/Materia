<?php

namespace Fuel\Migrations;

class Add_Play_State_To_Log_Play
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'last_state' => ['type' => 'longblob'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', ['last_state']);
	}
}
