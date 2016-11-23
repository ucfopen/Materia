<?php

namespace Fuel\Migrations;

class Add_Embedded_Only_To_Widget_Instance
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget_instance',
			[
				'embedded_only' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			]
		);
		\DB::query("ALTER TABLE widget_instance MODIFY COLUMN `embedded_only` ENUM('1','0') DEFAULT '0' AFTER `is_student_made`;");
	}

	public function down()
	{
		\DBUtil::drop_fields('widget_instance', 'embedded_only');
	}
}