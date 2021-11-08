<?php

namespace Fuel\Migrations;

class Add_action_to_notifications
{
	public function up()
	{
		\DBUtil::add_fields('notification', array(
			'action' => ['constraint' => 255, 'type' => 'varchar', 'null' => false]
		));
	}

	public function down()
	{
		\DBUtil::drop_fields('notification', ['action']);
	}
}
