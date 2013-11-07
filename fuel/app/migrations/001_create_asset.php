<?php

namespace Fuel\Migrations;

class Create_asset
{
	public function up()
	{
		\DBUtil::create_table(
			'asset',
			[
				'id'         => ['constraint' => 10, 'type' => 'varchar'],
				'type'       => ['constraint' => 10, 'type' => 'varchar'],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
				'title'      => ['constraint' => 300, 'type' => 'varchar'],
				'file_size'  => ['constraint' => 11, 'type' => 'int'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DB::query('ALTER TABLE '.\DB::quote_table('asset')." CHANGE `id` `id` VARCHAR(10)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('asset');
	}
}