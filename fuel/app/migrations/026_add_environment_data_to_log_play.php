<?php

namespace Fuel\Migrations;

class Add_environment_data_to_log_play
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'environment_data' => ['type' => 'longblob'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', 'environment_data');
	}
}
