<?php

namespace Fuel\Migrations;

class Create_notification
{
	public function up()
	{
		\DBUtil::create_table(
			'notification',
			[
				'id'            => ['constraint' => 255, 'type' => 'bigint', 'auto_increment' => true, 'unsigned' => true],
				'from_id'       => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'to_id'         => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'item_type'     => ['constraint' => 10, 'type' => 'int'],
				'item_id'       => ['constraint' => 100, 'type' => 'varchar'],
				'is_email_sent' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
				'is_read'       => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
				'subject'       => ['constraint' => 511, 'type' => 'varchar'],
				'avatar'        => ['constraint' => 511, 'type' => 'varchar', 'default' => ''],
				'created_at'    => ['constraint' => 11, 'type' => 'int'],
				'updated_at'    => ['constraint' => 11, 'type' => 'int'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('notification', 'from_id');
		\DBUtil::create_index('notification', 'to_id');
		\DBUtil::create_index('notification', 'item_type');
		\DBUtil::create_index('notification', 'is_email_sent');

		\DB::query('ALTER TABLE '.\DB::quote_table('notification')." CHANGE `item_id` `item_id` VARCHAR(100) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('notification');
	}
}
