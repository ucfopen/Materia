<?php

namespace Fuel\Migrations;

class Add_qset_id_to_log_play
{
	public function up()
	{
		\DBUtil::add_fields(
			'log_play',
			[
				'qset_id' => ['type' => 'int'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('log_play', 'qset_id');
	}
}
