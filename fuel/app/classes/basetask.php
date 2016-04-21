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

	protected static function get_files_from_args($args)
	{
		$files = [];

		foreach ($args as $arg)
		{
			// if the arg is a filepath, just use it
			if (file_exists($arg))
			{
				$files[] = $arg;
			}
			else
			{
				// if the arg is a glob string, parse it
				foreach (glob($arg) as $glob_match)
				{
					$files[] = $glob_match;
				}
			}
		}

		return $files;
	}
}
