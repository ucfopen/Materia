<?php

namespace Fuel\Migrations;

class Add_author_only_to_widget
{
	public function up()
	{
		\DBUtil::add_fields('widget', array(
			'author_only' => ['constraint' => "'0','1'", 'type' => 'enum'],
		));
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', array(
			'author_only'
		));
	}
}