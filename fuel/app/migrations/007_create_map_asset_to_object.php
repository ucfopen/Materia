<?php

namespace Fuel\Migrations;

class Create_map_asset_to_object
{
	public function up()
	{
		\DBUtil::create_table(
			'map_asset_to_object',
			[
				'object_id'   => ['constraint' => 255, 'type' => 'varchar'],
				'object_type' => ['constraint' => 10, 'type' => 'int'],
				'asset_id'    => ['constraint' => 10, 'type' => 'varchar'],
			],
			[],
			true,
			'InnoDB',
			'utf8_general_ci'
			);

		\DBUtil::create_index('map_asset_to_object', ['object_id', 'object_type', 'asset_id'], null, 'UNIQUE');

		\DB::query('ALTER TABLE '.\DB::quote_table('map_asset_to_object')." CHANGE `asset_id` `asset_id` VARCHAR(10)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
		\DB::query('ALTER TABLE '.\DB::quote_table('map_asset_to_object')." CHANGE `object_id` `object_id` VARCHAR(255)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('map_asset_to_object');
	}
}