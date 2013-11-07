<?php

namespace Fuel\Migrations;

class Create_widget
{
	public function up()
	{
		\DBUtil::create_table(
			'widget',
			[
				'id'                  => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'name'                => ['constraint' => 255, 'type' => 'varchar'],
				'clean_name'          => ['constraint' => 255, 'type' => 'varchar'],
				'group'               => ['constraint' => 255, 'type' => 'varchar'],
				'score_module'        => ['constraint' => 100, 'type' => 'varchar', 'default' => 'Base'],
				'creator'             => ['constraint' => 255, 'type' => 'varchar'],
				'player'              => ['constraint' => 255, 'type' => 'varchar'],
				'flash_version'       => ['constraint' => 10, 'type' => 'int', 'unsigned' => true],
				'api_version'         => ['constraint' => 3, 'type' => 'int', 'default' => '0'],
				'height'              => ['constraint' => 4, 'type' => 'smallint', 'unsigned' => true],
				'width'               => ['constraint' => 4, 'type' => 'smallint', 'unsigned' => true],
				'is_scalable'         => ['constraint' => "'0','1'", 'type' => 'enum'],
				'is_editable'         => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '1'],
				'is_playable'         => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '0'],
				'in_catalog'          => ['constraint' => "'0','1'", 'type' => 'enum'],
				'is_scorable'         => ['constraint' => "'0','1'", 'type' => 'enum'],
				'is_storage_enabled'  => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '0'],
				'is_qset_encrypted'   => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '1'],
				'is_answer_encrypted' => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '1'],
				'package_hash'        => ['constraint' => 32, 'type' => 'varchar'],
				'created_at'          => ['constraint' => 11, 'type' => 'int', 'unsigned' => true],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('widget', 'clean_name');
		\DBUtil::create_index('widget', 'in_catalog');

		\DB::query('ALTER TABLE '.\DB::quote_table('widget')." CHANGE `package_hash` `package_hash` VARCHAR(32) COLLATE utf8_bin NOT NULL DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('widget');
	}
}