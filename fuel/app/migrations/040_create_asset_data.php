<?php

namespace Fuel\Migrations;

class Create_asset_data
{
	public function up()
	{
		\DBUtil::create_table(
			'asset_data',
			[
				'id'         => ['constraint' => 10, 'type' => 'varchar', 'null' => false],
				'type'       => ['constraint' => 10, 'type' => 'varchar', 'null' => false],
				'status'     => ['constraint' => 20, 'type' => 'varchar'],
				'size'       => ['constraint' => 20, 'type' => 'varchar', 'null' => false],
				'bytes'      => ['constraint' => 20, 'type' => 'int'],
				'hash'       => ['constraint' => 255, 'type' => 'varchar'],
				'created_at' => ['constraint' => 11, 'type' => 'int', 'null' => false],
				'data'       => ['type' => 'longblob'],
			],
			['id', 'size'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		# make sure id is case sensitive
		\DB::query('ALTER TABLE '.\DB::quote_table('asset_data')." CHANGE `id` `id` VARCHAR(10) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();

		\DBUtil::create_index('asset_data', 'hash');
		\DBUtil::create_index('asset_data', 'created_at');
	}

	public function down()
	{
		\DBUtil::drop_table('asset_data');
	}
}
