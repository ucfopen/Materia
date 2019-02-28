<?php
namespace Materia;

class Score_Modules_TestWidgetTwo extends Score_Module
{
	public $allow_distribution = true;

	public function check_answer($log)
	{
		return 100;
	}

}
