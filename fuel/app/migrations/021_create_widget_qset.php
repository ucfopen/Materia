<?php

namespace Fuel\Migrations;

class Create_widget_qset
{
	public function up()
	{
		\DBUtil::create_table(
			'widget_qset',
			[
				'id'         => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'inst_id'    => ['constraint' => 10, 'type' => 'varchar'],
				'version'    => ['constraint' => 10, 'type' => 'varchar', 'null' => true, 'default' => '1'],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
				'data'       => ['type' => 'longblob'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('widget_qset', 'id');
		\DBUtil::create_index('widget_qset', 'created_at');

		\DB::query('ALTER TABLE '.\DB::quote_table('widget_qset')." CHANGE `inst_id` `inst_id` VARCHAR(10)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('widget_qset');
	}
}