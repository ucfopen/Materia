<?php

namespace Fuel\Migrations;

class Remove_remote_url_from_asset
{
	public function up()
	{
		\DBUtil::drop_fields('asset', array(
			'remote_url'

		));
	}

	public function down()
	{
		\DBUtil::add_fields('asset', array(
			'remote_url' => ['constraint' => 300, 'type' => 'varchar', 'null' => true],

		));
	}
}
