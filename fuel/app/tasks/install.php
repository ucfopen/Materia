<?php
namespace Fuel\Tasks;

class Install
{
	public static function run()
	{
		// let the user set the environment
		if (\Cli::option('skip_prompts', false) != true)
		{
			\Fuel::$env = \Cli::prompt('Choose your environment', ['development', 'production', 'staging']);
		}

		\Cli::write("FuelPHP environment set to: '".\Fuel::$env."'");

		self::prompt_and_run('Run configuration wizard?', 'configuration_wizard');
		self::prompt_and_run('Set writable paths?', 'make_paths_writable');
		self::prompt_and_run('Clear Server Cache?', 'clear_cache');
		self::prompt_and_run('Run Migrations?', 'setup_migrations');
		self::prompt_and_run('Populate User Roles?', 'populate_roles');
		self::prompt_and_run('Populate Defaults Semesters?', 'populate_semesters');
		self::prompt_and_run('Create Default Users?', 'create_default_users');
	}

	private static function prompt_and_run($text, $method)
	{
		// was the cli option set to skip this method?
		if (\Cli::option("skip_{$method}", false)) return;

		// was prompt requested and they said no?
		$should_prompt = \Cli::option('skip_prompts', false) != true;
		if ($should_prompt && \Cli::prompt("\r\n{$text}", ['y', 'n']) == 'n') return;
		// execute the method
		try{
			\Oil\Refine::run("admin:{$method}" , []);
		} catch(\Exception $e){
			\Cli::write("Error running `php oil refine admin:{$method}`");
			\Cli::write($e->getMessage());
		}
	}
}
