<?php

namespace Fuel\Tasks;

class Install
{

	public static function run($skip_prompts=false, $install_widgets=true)
	{
		$writable_paths = [
			APPPATH.'cache',
			APPPATH.'logs',
			APPPATH.'tmp',
			APPPATH.'config',
			// custom materia stuff
			PKGPATH.'materia/media',
			PKGPATH.'materia/media/large',
			PKGPATH.'materia/media/thumbnail',
			PKGPATH.'materia/media/uploads',
			PKGPATH.'materia/vendor/widget/score_module',
			PKGPATH.'materia/vendor/widget/test',
			DOCROOT.'static/widget',
			DOCROOT.'static/widget/test'
		];

		foreach ($writable_paths as $path)
		{
			if ( ! file_exists($path))
			{
				mkdir($path);
			}
			if (@chmod($path, 0777))
			{
				\Cli::write("Made writable: $path", 'green');
			}
			else
			{
				\Cli::write("Failed to make writable: $path", 'red');
				exit(1);
			}
		}

		// get the materia admin tasks
		require_once(PKGPATH.'materia/tasks/admin.php');

		// bypass interactive mode with -quiet
		if (\Cli::option('skip_prompts', $skip_prompts) === false)
		{
			\Cli::write('This task builds a working Materia server.', 'green');
			\Cli::write('Runs all database migrations, populates needed data, creates an admin user, and will install the core widgets.');
			if (\Cli::prompt('Continue?', array('y', 'n')) != 'y') return;
		}

		\Fuel\Tasks\Admin::clear_cache();
		\Fuel\Tasks\Admin::setup_migrations();
		\Fuel\Tasks\Admin::populate_roles();
		\Fuel\Tasks\Admin::populate_semesters();
		\Fuel\Tasks\Admin::create_default_users();

		if (\Cli::option('install_widgets', $install_widgets) === true)
		{
			require_once(PKGPATH.'materia/tasks/widget.php');
			\Fuel\Tasks\Widget::install_from_config();
		}
	}
}
