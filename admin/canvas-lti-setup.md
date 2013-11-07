---
layout: page
title: Canvas LTI Setup
tagline: Getting Materia to work seamlessly with Canvas
class: admin
---
{% include JB/setup %}

# Installing Materia into Instructure's Canvas #

## Setting up Canvas ##

First, take a look at [Instructure's tutorial](http://help.instructure.com/entries/21113807-tutorial-adding-an-extension-to-canvas) which covers adding an extension to Canvas. You'll enter the following settings into the **Edit External Tool** form:

* **Consumer Key**: key as defined in configuration file
* **Shared Secret**: secret as defined in configuration file
* **Configuration Type**: By URL
* **Configuration URL** `http://your/materia/location/lti`

<aside>
	It is very important you keep the shared secret... well, secret.  These are defined in the configuration files described below.
</aside>

## Materia LTI Configuration Files ##

The default configuration is in `/fuel/app/packages/modules/lti/config/lti.php`, and your environment's config would be `/fuel/app/packages/modules/lti/config/&lt;ENVIRONMENT&gt;/lti.php`.

<aside>
	Fuelphp uses environments to enable different configuration options in production or development.  For more information view the <a href="http://fuelphp.com/docs/general/environments.html#/env_config">Fuelphp Documentation covering Environments</a>
</aside>

## Materia Configuration ##

### Name Your Materia Install ###
Generate a unique identifier for your install in the `lti.tool_consumer_instance_guid` configuation setting.

	// Settings for this particular install
	// Change the tool_consumer_instance_guid to something unique to your install!
	'tool_consumer_instance_guid'            => '&lt;SOME_UNIQUE_IDENTIFIER&gt;',
	'tool_consumer_info_version'             => '1',
	...

### Add a Consumer ###
The configuration file defines which consumers can connect to Materia. For Canvas you need the following:

	'canvas' => [
		// these display in the consumer's dialogs
		'title'             => 'Materia Widget Assignment',
		'description'       => 'Add a Materia Widget as an assignment',

		// the platform that this lti consumer is intended to match up with
		'platform'          => 'canvas.instructure.com',

		// When receiving a launch message, what fields do we use as a user identifier?
		// remote_identifier is the key of the lti data sent
		// local_identifier is the name of the user property to match
		// to use email instead of sourcedid, remote = 'lis_person_contact_email_primary' and local = 'email'
		'remote_identifier' => 'lis_person_sourcedid',
		'local_identifier'  => 'username',

		// if the incoming user is not in our database, should we create it?
		'create_if_missing' => false,

		// If any identifier already exists locally, should I update or fail
		// Note: the user table uses both the username and email address as unique keys
		'update_if_exists' => true,

		// which auth driver will do the final work authenticating this user
		'auth_driver'       => 'SimpleAuth',

		// Should we bother saving the assocation of the chosen widget to the resource
		// most LTI consumers do not actually know which widget they are requesting
		// But Materia has an optional message that can request a specific widget
		'save_assoc'        => true,

		// How many seconds should the oauth token be valid since created
		'timeout'           => 3600,

		// Define the privacy level this integration to the consumer
		// public
		'privacy'           => 'public',

		// Security Settings CHANGE THESE!!!
		'secret'            => 'secret',
		'key'               => 'key',
	],