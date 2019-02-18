<?php

namespace Fuel\Migrations;

class Add_published_by_to_widget_instance
{
	public function up()
	{
		\DBUtil::add_fields('widget_instance', array(
			'published_by' => ['constraint' => 255, 'type' => 'bigint', 'unsigned' => true, 'null' => true]
		));

		//for each published widget instance, fill the new 'published_by' column with the creator of that instance
		\DB::update('widget_instance')
			->value('published_by', \DB::expr('user_id'))
			->where('is_draft', '0')
			->execute();
	}

	public function down()
	{
		\DBUtil::drop_fields('widget_instance', array(
			'published_by'
		));
	}
}