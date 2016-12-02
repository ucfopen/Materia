<?php

namespace Fuel\Migrations;

class Add_status_to_asset
{
	public function up()
	{
		\DBUtil::add_fields(
			'asset',
			[
				'status' => [
					'type' => 'varchar',
					'constraint' => 32,
					'null' => true
				],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('asset', 'status');
	}
}
