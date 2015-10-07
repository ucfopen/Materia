<?php

namespace Fuel\Migrations;

class Add_auth_to_log_play
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'auth' => ['constraint' => 100, 'type' => 'varchar'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', 'auth');
	}
}
