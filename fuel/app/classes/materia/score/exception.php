<?php
namespace Materia;

class Score_Exception extends \Exception
{
	public $title;
	public $message;

	public function __construct($title, $message)
	{
		$this->title   = $title;
		$this->message = $message;
	}
}