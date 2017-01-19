<?php

namespace Materia;
use \RocketDuck\Msg;
use \RocketDuck\Util_Validator;

class Api_Admin
{
	static public function widgets_get()
	{
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) throw new HttpNotFoundException;
		return Widget_Manager::get_all_widgets();
	}

	static public function widget_update($widget)
	{
		if ( ! \RocketDuck\Perm_Manager::is_super_user() ) throw new HttpNotFoundException;
		return Widget_Manager::update_widget($widget);
	}
}