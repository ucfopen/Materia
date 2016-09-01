<?php

namespace Fuel\Migrations;

class Add_Remote_Url_To_Asset
{
	public function up()
	{
		\DBUtil::add_fields(
			'asset',
			[
				'remote_url' => ['constraint' => 255, 'type' => 'varchar', 'default' => '']
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('asset', ['remote_url']);
	}
}
