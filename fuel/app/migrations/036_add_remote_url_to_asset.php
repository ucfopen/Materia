<?php

namespace Fuel\Migrations;

class Add_remote_url_to_asset
{
	public function up()
	{
		\DBUtil::add_fields('asset', array(
			'remote_url' => ['constraint' => 300, 'type' => 'varchar', 'null' => true],

		));
	}

	public function down()
	{
		\DBUtil::drop_fields('asset', array(
			'remote_url'

		));
	}
}