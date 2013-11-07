<?php

namespace Fuel\Migrations;

class Create_user_meta
{
	public function up()
	{
		\DBUtil::create_table(
			'user_meta',
			[
				'user_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'meta'    => ['constraint' => 255, 'type' => 'varchar'],
				'value'   => ['type' => 'longtext'],
			],
			['user_id', 'meta'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

	}

	public function down()
	{
		\DBUtil::drop_table('user_meta');
	}
}