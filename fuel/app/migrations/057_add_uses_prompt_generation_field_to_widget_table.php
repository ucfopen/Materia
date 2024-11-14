<?php

namespace Fuel\Migrations;

class Add_uses_prompt_generation_field_to_widget_table
{
	public function up()
	{
		\DBUtil::add_fields('widget', array(
			'uses_prompt_generation' => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '0'],
		));
	}

	public function down()
	{
		\DBUtil::drop_fields('widget', array(
			'uses_prompt_generation',
		));
	}
}
