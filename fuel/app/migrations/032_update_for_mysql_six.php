<?php

namespace Fuel\Migrations;

class Update_For_Mysql_Six
{
	public function up()
	{
		\DBUtil::modify_fields('widget_instance', [
			'updated_at' => ['constraint' => 11, 'type' => 'int', 'default' => 0],
		]);

		\DBUtil::modify_fields('log_play', [
			'score' => ['constraint' => '52,2', 'type' => 'decimal', 'default' => 0],
			'score_possible' => ['constraint' => 50, 'type' => 'int', 'default' => 0],
			'percent'        => ['type' => 'double', 'default' => 0],
			'elapsed'        => ['constraint' => 11, 'type' => 'int', 'default' => 0],
		]);

		\DBUtil::modify_fields('users', [
				'first'          => ['constraint' => 100, 'type' => 'varchar', 'default' => ''],
				'last'           => ['constraint' => 100, 'type' => 'varchar', 'default' => ''],
				'password'       => ['constraint' => 255, 'type' => 'varchar', 'default' => ''],
				'email'          => ['constraint' => 255, 'type' => 'varchar', 'default' => ''],
				'login_hash'     => ['constraint' => 255, 'type' => 'varchar', 'default' => ''],
				'created_at'     => ['constraint' => 11, 'type' => 'int', 'unsigned' => true, 'default' => 0],
				'updated_at'     => ['constraint' => 11, 'type' => 'int', 'unsigned' => true, 'default' => 0],
		]);

	}

	public function down()
	{

	}
}
