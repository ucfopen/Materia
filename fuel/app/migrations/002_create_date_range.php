<?php

namespace Fuel\Migrations;

class Create_date_range
{
	public function up()
	{
		\DBUtil::create_table(
			'date_range',
			[
				'id'       => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'semester' => ['constraint' => 255, 'type' => 'varchar'],
				'year'     => ['constraint' => 4, 'type' => 'int'],
				'start_at' => ['constraint' => 11, 'type' => 'int'],
				'end_at'   => ['constraint' => 11, 'type' => 'int'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('date_range', ['semester', 'year', 'start_at', 'end_at'], null, 'UNIQUE');
	}

	public function down()
	{
		\DBUtil::drop_table('date_range');
	}
}