<?php

namespace Fuel\Migrations;

class Add_remote_url_to_asset
{
	public function up()
	{
		\DBUtil::add_fields(
			'asset',
			[
				'remote_url' => [
					'type' => 'text',
					'null' => true
				],
			]
		);
	}

	public function down()
	{
		\DBUtil::drop_fields('asset', 'remote_url');
	}
}
