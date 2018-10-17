<?php

namespace Fuel\Migrations;

class Remove_status_from_asset
{
	public function up()
	{
		\DBUtil::drop_fields('asset', 'status');
	}

	public function down()
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
}
