<?php

namespace Fuel\Migrations;

class Create_widget_instance
{
	public function up()
	{
		\DBUtil::create_table(
			'widget_instance',
			[
				'id'         => ['constraint' => 10, 'type' => 'varchar'],
				'widget_id'  => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'user_id'    => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
				'name'       => ['constraint' => 100, 'type' => 'varchar'],
				'is_draft'   => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
				'height'     => ['constraint' => 4, 'type' => 'tinyint', 'default' => 0],
				'width'      => ['constraint' => 4, 'type' => 'tinyint', 'default' => 0],
				'open_at'    => ['constraint' => 11, 'type' => 'int', 'default' => -1],
				'close_at'   => ['constraint' => 11, 'type' => 'int', 'default' => -1],
				'attempts'   => ['constraint' => 11, 'type' => 'int', 'default' => -1],
				'is_deleted' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('widget_instance', 'user_id');
		\DBUtil::create_index('widget_instance', 'created_at');
		\DBUtil::create_index('widget_instance', 'is_draft');
		\DBUtil::create_index('widget_instance', 'is_Deleted');

		\DB::query('ALTER TABLE '.\DB::quote_table('widget_instance')." CHANGE `id` `id` VARCHAR(10) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();

	}

	public function down()
	{
		\DBUtil::drop_table('widget_instance');
	}
}