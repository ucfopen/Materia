<?php

namespace Fuel\Migrations;

class Add_featured_to_widget
{
	public function up()
	{
		\DBUtil::add_fields(
			'widget', // find the table that contains the assets.
			[
				'featured' => ['type' => 'enum', 'constraint' => "'0','1'", 'default' => '0'],
			]
		);

		// Update featured field to match in_catalog values
		\DB::update('widget')
			->value('featured', \DB::expr('in_catalog'))
			->execute();

	}

	public function down()
	{
		\DBUtil::drop_fields(
			'widget',
			['featured']
		);
	}
}