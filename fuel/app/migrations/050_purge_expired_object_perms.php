<?php

namespace Fuel\Migrations;

class Purge_expired_object_perms
{
	public function up()
	{
        // Materia now sends out notifications when your permissions expire & are deleted
        // Prior to 7.0.0, this was handled differently, so we never purged the expired perms
        // Post 7.0.0 we do, so this is to prevent the first runs after upgrading from
        // sending out hundreds of emails
		\DB::delete('perm_object_to_user')
			->where('expires_at', '<=', time())
			->execute();
	}

	public function down()
	{
		// nothing to do
	}
}
