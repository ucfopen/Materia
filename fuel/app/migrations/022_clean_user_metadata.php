<?php

namespace Fuel\Migrations;

class Clean_user_metadata
{
	public function up()
	{

		$rows = \DB::select('id', 'profile_fields')->from('users')->execute();

		foreach ($rows as $row)
		{
			$data = unserialize($row['profile_fields']);

			// clean up notify
			if (isset($data['notify_on_perm_change']))
			{
				$data['notify'] = $data['notify_on_perm_change'];
				unset($data['notify_on_perm_change']);
			}
			else
			{
				$data['notify'] = true;
			}

			// clean up beardmode
			if (isset($data['beardmode']))
			{
				$data['beardMode'] = $data['beardmode'] === 'on';
				unset($data['beardmode']);
			}
			else
			{
				$data['beardMode'] = false;
			}

			// clean up avatar
			if (isset($data['avatar']))
			{
				$data['useGravatar'] = $data['avatar'] === 'gravatar';
				unset($data['avatar']);
			}
			else
			{
				$data['useGravatar'] = true;
			}

			$clean = serialize($data);

			\DB::update('users')->set(['profile_fields' => $clean])->where('id', '=', $row['id'])->execute();
		}

	}

	public function down(){}
}