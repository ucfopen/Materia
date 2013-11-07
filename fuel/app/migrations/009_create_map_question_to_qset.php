<?php

namespace Fuel\Migrations;

class Create_map_question_to_qset
{
	public function up()
	{
		\DBUtil::create_table(
			'map_question_to_qset',
			[
				'qset_id'     => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
				'question_id' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true],
			],
			null,
			true,
			'InnoDB',
			'utf8_general_ci'
		);

		\DBUtil::create_index('map_question_to_qset', 'qset_id');
		\DBUtil::create_index('map_question_to_qset', 'question_id');
	}

	public function down()
	{
		\DBUtil::drop_table('map_question_to_qset');
	}
}