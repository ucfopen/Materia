---
layout: page
title: Administrative Commands
tagline: Making use of Fuel tasks to automate Materia administration
class: admin
---
{% include JB/setup %}

# Using Materia's Fuel tasks #

Once you've made an SSH connection to your machine, cd into the root **Materia** directory.

<aside>
	If you're using the Vagrant virtual environment, the directory is <strong>/mnt/host</strong>
</aside>

## Running a task ##

The tasks are run using FuelPhp's oil library.  Oil allows you to execute php commands with full knowledge of the FuelPhp framework.  Keep in mind that oil executes in the cli version of php from which you execute commands.

We will run Oil Refine commands using: `php oil r`.

<aside>
	When executing oil commands on the Vagrant virtual machine, make sure you do so by sshing into the box.  Running oil commands from the host machine is unpredictable.  It will not be able to connect to the database, and may not have the required Php CLI version installed.
</aside>

You can see a list of each function each task provides by just running that task with no additional arguments. For example, __php oil r admin__ would list all of the functions within the **admin** task.

Like so:

<pre><code class="bash">vagrant@precise64:~/materia$ php oil r admin
	<span class="green">available commands:</span>
	<span class="yellow">setup_migrations
	destroy_everything
	destroy_widgets
	destroy_database
	populate
	populate_semesters
	populate_roles
	give_user_role
	new_user
	clear_cache
	import_sql
	anonymize_users
	change_db_prefix</span></code>
</pre>

While most of the functions offered by each task are fairly self-explanatory, here listed is a brief summary of what each one does and what arguments they expect.

## Admin ##
* **setup_migrations**

	This function will run all of the migrations for Materia, all of the installed modules, and all of the included packages.

	`php oil r admin:setup_migrations`
* **destroy_everything**

	This is a shortcut function, which will run both destroy_widgets and destroy_database.

	`php oil r admin:destroy_everything`
* **destroy_widgets**

	This will uninstall all installed widgets.

	`php oil r admin:destroy_widgets`
* **destroy_database**

	This will completely remove all database contents.

	`php oil r admin:destroy_database`
* **populate**

	After all migrations are run, this will fill databases with the information necessary for Materia by running populate_semesters and populate_roles automatically.

	`php oil r admin:populate [create admin user: true/false]`
* **populate_semesters**

	This is a shortcut function, which will run the semester task's populate function for the years 2001 to 2037.

	`php oil r admin:populate_semesters`
* **populate_roles**

	This will populate the database with the 'basic author' and 'super user' roles if they have not been added already.

	`php oil r admin:populate_roles`
* **give_user_role**

	This will give the specified role to the specified user. To view role names and permissions, see [here](../develop/platform-developer-guide.html#roles).

	`php oil r admin:give_user_role <username> <role name>`
* **new_user**

	Creates a new user from given information.

	`php oil r admin:new_user <username> <firstname> <middle initial> <lastname> <e-mail> <password>`
* **clear_cache**

	Completely clears all cached data (primarily the contents of fuel/app/cache).

	`php oil r admin:clear_cache`
* **import_sql**

	This will run the given string of raw SQL

	`php oil r admin:import_sql <sql>`
* **anonymize_users**

	This will randomize the username, first name, middle initial, last name, and e-mail address of all users in the database unless specified.

	`php oil r admin:anonymize_users [<skip usernames> ...]`
* **change_db_prefix**

	This will prepend a prefix to each table in the database, and remove old tables if specified.

	`php oil r admin:change_db_prefix <prefix> [<existing prefix to remove>]`

## Semester ##
* **populate**

	This will populate the database with semester information between two given years, including the start and end dates for Spring, Summer, and Fall semesters in each inclusive year.

	`php oil r semester:populate <start year> <end year>`

## Widget ##
* **copy**

	This will prompt you to log in as a particular user, then specify a widget ID to copy and a name for the new widget. It will attempt to copy the given widget with that user's permissions.

	`php oil r widget:copy`
* **show_instance**

	This will output all information about a widget instance to the screen.

	`php oil r widget:show_instance <instance id>`
* **show_qset**

	This will output all information about a widget's question set to the screen. Single required argument: widget instance ID.
* **strip_backslashes**

	This will recursively go through each property in a widget's question set and strip unnecessary backslashes from it, if any exist.

	`php oil r widget:strip_backslashes <instance id>`
* **delete**

	This will remove all permissions for the specified widget then remove it from the database if possible. Single required argument: widget instance ID.

	`php oil r widget:delete <instance id>`
* **create_instance**

	`php oil r widget:install -i`

	or

	`php oil r widget:install <as user id> <engine id> <title> <owner id>`

* **import_qset**

	This will prompt you for the location of a yaml file containing the question set you'd like to import into the specified widget instance.

	`php oil r widget:import_qset <instance id>`

* **export_qset**

	This will export the specified widget instance's question set to the Materia install's root directory as a yaml file.

	`php oil r widget:export_qset <instance id>`

* **install**

	`php oil r widget:install [--validate-only] [--upgrade] [--force] [--db-only] [--help]`

	**Options:**
	* `--validate-only` (`-v`) : Validates packages to test if they are installable, but won't install them.
	* `--upgrade` (`-u`) : Automatically overwrites existing installed packages with the same name as newer packages.
	* `--force` (`-f`) : Will overwrite packages even if the installed package appears to be the same.
	* `--db-only` (`-d`) : Installation will modify the database but won't install files.
	* `--help` (`-?`) : Displays a message explaining each option for this function.

* **export**

	This will export a specified widget instance into a .wigt package if it is possible to do so.

	`php oil r widget:export <engine id>`
