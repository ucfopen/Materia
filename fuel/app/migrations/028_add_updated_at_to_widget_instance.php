<?php

namespace Fuel\Migrations;

class Add_updated_at_to_widget_instance
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget_instance',
			[
				'updated_at' => ['constraint' => 11, 'type' => 'int'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('widget_instance', 'updated_at');
	}
}
