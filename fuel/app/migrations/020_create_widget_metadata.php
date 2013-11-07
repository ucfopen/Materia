<?php

namespace Fuel\Migrations;

class Create_widget_metadata
{
	public function up()
	{
		\DBUtil::create_table(
			'widget_metadata',
			[
				'widget_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'name'      => ['type' => 'varchar','constraint' => 255 ],
				'value'     => ['type' => 'text'],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('widget_metadata', 'widget_id');
		\DBUtil::create_index('widget_metadata', 'name');
	}

	public function down()
	{
		\DBUtil::drop_table('widget_metadata');
	}
}