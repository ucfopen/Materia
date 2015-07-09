<?php

namespace Fuel\Migrations;

class Add_is_student_made_to_widget_instance
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget_instance',
			[
				'is_student_made' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('widget_instance', 'is_student_made');
	}
}