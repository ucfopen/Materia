<?php
/**
 * Materia
 * License outlined in licenses folder
 */

trait Trait_Supportinfo
{
	protected function add_inline_info()
	{
		if (\Lang::get('support.sections'))
		{
			$sections = \Lang::get('support.sections');

			$encoded = base64_encode(json_encode($sections));
			Js::push_inline("var SUPPORT_INFO = '".$encoded."';");
		}
	}

}
