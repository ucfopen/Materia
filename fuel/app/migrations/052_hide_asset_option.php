<?php

namespace Fuel\Migrations;

class Hide_asset_option
{
	public function up()
	{
		\DBUtil::add_fields(
			'asset', // find the table that contains the assets.
			[
				'deleted_at' => ['constraint' => 11, 'type' => 'int', 'default' => -1],
				'is_deleted' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			]
			);
	}

	public function down()
	{
		\DBUtil::drop_fields(
			'asset',
			['deleted_at', 'is_deleted']
		);
	}
}