<?php

namespace Fuel\Migrations;

class Add_exports_column_to_widget
{
	public function up()
	{
		\DBUtil::add_fields('widget', array(
			'logs_export_methods' => array('constraint' => 255, 'type' => 'varchar'),

		));
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', array(
			'logs_export_methods'

		));
	}
}