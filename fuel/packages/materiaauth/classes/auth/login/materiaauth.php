<?

class MateriaAuthUserUpdateException extends \FuelException {}

class Auth_Login_Materiaauth extends Auth_Login_Simpleauth
{

	static public function update_role($user_id, $is_employee = false)
	{
		$user = \Model_User::find($user_id);

		// grab our user first to see if overrrideRoll has been set to 1
		if ($user instanceof \Model_User)
		{
			// add employee role
			if ($is_employee)
			{
				return \RocketDuck\Perm_Manager::add_users_to_role_system_only([$user->id], \RocketDuck\Perm_Role::AUTHOR);
			}
			// not an employee anymore, remove role
			else
			{
				return \RocketDuck\Perm_Manager::remove_users_from_roles_system_only([$user->id], [\RocketDuck\Perm_Role::AUTHOR]);
			}
		}
	}

}
