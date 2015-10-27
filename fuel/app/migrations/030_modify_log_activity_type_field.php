<?php

namespace Fuel\Migrations;

class Modify_log_activity_type_field
{
	public function up()
	{
		\DBUtil::modify_fields(
			'log_activity',
			[
				'type' => ['constraint' => 255, 'type' => 'varchar']
			]
		);
	}

	public function down()
	{
		\DBUtil::modify_fields(
			'log_activity',
			[
				'type' => ['type' => 'enum', 'constraint' => "'loggedIn','loggedOut','createdWidget','editedWidget','deletedWidget','editedWidgetSettings'"],
			]
		);
	}
}
