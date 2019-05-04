<?php

namespace Fuel\Migrations;

class Add_Guides_To_Widget
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget',
			[
				'creator_guide' => [
					'constraint' => 255,
					'type' => 'varchar',
					'null' => false
				],
				'player_guide' => [
					'constraint' => 255,
					'type' => 'varchar',
					'null' => false
				]
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', ['creator_guide', 'player_guide']);

	}
}
