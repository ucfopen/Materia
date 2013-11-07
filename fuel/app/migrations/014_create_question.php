<?php

namespace Fuel\Migrations;

class Create_question
{
	public function up()
	{
		\DBUtil::create_table(
			'question',
			[
				'id'         => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'auto_increment' => true],
				'user_id'    => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'type'       => ['constraint' => 255, 'type' => 'varchar'],
				'text'       => ['type' => 'mediumtext'],
				'data'       => ['type' => 'mediumtext', 'null' => true],
				'hash'       => ['type' => 'varchar', 'constraint' => 32],
				'created_at' => ['constraint' => 11, 'type' => 'int'],
			],
			['id'],
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('question', 'user_id');
		\DBUtil::create_index('question', 'type');
		\DBUtil::create_index('question', ['hash'], null, 'UNIQUE');

	}

	public function down()
	{
		\DBUtil::drop_table('question');
	}
}