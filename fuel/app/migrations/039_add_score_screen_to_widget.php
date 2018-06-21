<?php

namespace Fuel\Migrations;

class Add_score_screen_to_widget
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget',
			[
				'score_screen' => [
					'type' => 'varchar',
					'constraint' => 255,
					'null' => false
				],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', 'score_screen');
	}
}
