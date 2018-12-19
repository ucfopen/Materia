<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */
namespace Materia;

class Widget_Question_Answer
{

	public $id = 0;
	public $options = [];
	public $question_id = 0;
	public $text = '';
	public $value = 100;

	public function __construct($properties=[])
	{
		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
		}
	}

	public function clean_for_remoting()
	{
		unset($this->question_id);
		if ($this->value == 0) unset($this->value);
	}
}
