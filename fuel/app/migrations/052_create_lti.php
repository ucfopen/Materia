<?php

namespace Fuel\Migrations;

class Create_lti
{
	public function up()
	{
		\DBUtil::create_table('lti', array(
			'id' => array('constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true),
			'item_id' => array('constraint' => 255, 'type' => 'varchar'),
			'resource_link' => array('constraint' => 255, 'type' => 'varchar'),
			'consumer' => array('constraint' => 255, 'type' => 'varchar'),
			'consumer' => array('constraint' => 255, 'type' => 'varchar'),
			'consumer_guid' => array('constraint' => 255, 'type' => 'varchar'),
			'user_id' => array('constraint' => 255, 'type' => 'varchar'),
			'name' => array('constraint' => 255, 'type' => 'varchar', 'null' => true),
			'context_id' => array('constraint' => 255, 'type' => 'varchar', 'null' => true),
			'context_title' => array('constraint' => 255, 'type' => 'varchar', 'null' => true),
			'created_at' => array('constraint' => 11, 'type' => 'int'),
			'updated_at' => array('constraint' => 11, 'type' => 'int'),

		), array('id'));

		\DBUtil::create_index('lti', ['item_id']);
		\DBUtil::create_index('lti', ['resource_link']);
		\DBUtil::create_index('lti', ['consumer_guid']);

		\DB::query('ALTER TABLE '.\DB::quote_table('lti')." CHANGE `item_id` `item_id` VARCHAR(255)  COLLATE utf8_bin  NOT NULL  DEFAULT ''")->execute();
	}

	public function down()
	{
		\DBUtil::drop_table('lti');
	}
}