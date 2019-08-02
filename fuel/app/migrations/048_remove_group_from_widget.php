<?php

namespace Fuel\Migrations;

class Remove_group_from_widget
{
	public function up()
	{
		\DBUtil::drop_fields('widget', array(
			'group'

		));
	}

	public function down()
	{
		\DBUtil::add_fields('widget', array(
			'group' => ['constraint' => 255, 'type' => 'varchar'],

		));
	}
}
