<?php

namespace Fuel\Migrations;

class Add_guest_access_to_widget_instance
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget_instance',
			[
				'guest_access' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('widget_instance', 'guest_access');
	}
}
