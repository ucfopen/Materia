<?php

namespace Fuel\Migrations;

class Add_referrer_url_to_log_play
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'referrer_url' => ['constraint' => 255, 'type' => 'varchar'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', 'referrer_url');
	}
}
