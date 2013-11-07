<?php

class Basetask
{
	public static function run()
	{
		\Cli::write(\Cli::color('available commands:', 'green'));
		$class = get_called_class();
		foreach (get_class_methods($class) as $val)
		{
			/* Get a reflection object for the class method */
			$reflect = new \ReflectionMethod($class, $val);
			if ($reflect->isPublic())
			{
				\Cli::write(\Cli::color("\t".$val, 'yellow'));
			}
		}
	}
}