<?php

namespace Fuel\Migrations;

class Create_sessions
{
	public function up()
	{
		\DBUtil::create_table('sessions', array(
			'session_id' => array('constraint' => 40, 'type' => 'varchar', 'null' =>false),
			'previous_id' => array('constraint' => 40, 'type' => 'varchar', 'null' => false),
			'user_agent' => array('type' => 'text'),
			'ip_hash' => array('type' => 'char', 'constraint' => 32, 'default' => '', 'null' => false),
			'created' => array('type' => 'int', 'constraint' => 10, 'null' => false, 'default' => 0, 'unsigned' => true),
			'updated' => array('type' => 'int', 'constraint' => 10, 'null' => false, 'default' => 0, 'unsigned' => true),
			'payload' => array('type' => 'text', '  null' => false)
		), array('session_id'), true, 'InnoDB','utf8_unicode_ci');
		\Fuel\Core\DBUtil::create_index('sessions', 'previous_id', 'PREVIOUS', 'UNIQUE');
	}

	public function down()
	{
		\DBUtil::drop_table('sessions');
	}
}
