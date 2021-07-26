<?php
namespace Fuel\Tasks;

class Install
{
	public static function run()
	{
		\Crypt::encode('this is just here to initialize fuel/app/config/crypt.php');
		self::prompt_and_run('Make required paths writable?', 'make_paths_writable');
		self::prompt_and_run('Clear server cache?', 'clear_cache');
		self::prompt_and_run('Run migrations?', 'setup_migrations');
		self::prompt_and_run('Populate user roles?', 'populate_roles');
		self::prompt_and_run('Populate defaults semesters?', 'populate_semesters');
		self::prompt_and_run('Create default users?', 'create_default_users');
	}

	private static function prompt_and_run($text, $method, $exec = true)
	{
		// was the cli option set to skip this method?
		if (\Cli::option("skip_{$method}", false)) return;

		// was prompt requested and they said no?
		$should_prompt = \Cli::option('skip_prompts', false) != true;
		if ($should_prompt && \Cli::prompt("\r\n{$text}", ['y', 'n']) == 'n') return;

		try{
			// these are run in a subshell because fuel doesn't much like
			// changing the config variables on the fly
			passthru("php oil r admin:{$method}");
		} catch (\Exception $e) {
			\Cli::write("Error running `php oil refine admin:{$method}`");
			\Cli::write($e->getMessage());
		}
	}
}
