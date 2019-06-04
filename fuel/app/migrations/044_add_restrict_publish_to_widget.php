<?php

namespace Fuel\Migrations;

class Add_restrict_publish_to_widget
{
	public function up()
	{
		\DBUtil::add_fields('widget', array(
			'restrict_publish' => ['constraint' => "'0','1'", 'type' => 'enum'],
		));
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', array(
			'restrict_publish'
		));
	}
}