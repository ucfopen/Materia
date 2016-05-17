<?php

namespace Fuel\Migrations;

class Modify_Log_Activity_Type_Field
{
	public function up()
	{
		\DBUtil::modify_fields(
			'log_activity',
			[
				'type' => ['constraint' => 255, 'type' => 'varchar', 'default' => '']
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
