---
layout: page
title: Platform Developer Guide
tagline: Customizing and Extending the Materia Platform
class: developers
---
{% include JB/setup %}

# Overview #

Materia is built on the <a href="http://fuelphp.com/">FuelPHP 1.5</a> framework.

# Setup #

First you'll need to get Materia installed and setup.  Select <a href="{{BASE_PATH}}/admin/deploying-materia.html">Deploying Materia</a> to get started.

# Packages #

Below is a summary of the FuelPHP packages used by Materia:

* **auth**: Handles user authentication
* **[casset](https://github.com/canton7/fuelphp-casset)**: Manages client-side dependences (such as loading stylesheets &amp; javascript libraries)
* **email**: Needed since the notification system can optionally send email notices
* **materia**: The primary package that provides the functionality for Materia
* **oil**: Used for database migration and command-line management tasks
* **orm**: Abstracts the database and provides tools &amp; features to create queries
* **parser**: Allows views to use other template parsers (such as Markdown, Smarty, etc)
* **plupload**: Provides media upload functionality
* **rocketduck**: RocketDuck is a custom framework that supplies additional functionality needed for Materia

## Materia package ##

`classes/api/v1.php` is the primary API which the majority of the code utilizes. The API functions then interact with the many static managers in `classes` (such as `Perm_Manager` to manage permissions, and so on).

<!--
	there's some models in the main app and some models abstracted into packages.

	configuration
	where to put it

	all packages that we use

	general layout of where stuff is-->


# Architecture #

Materia is not completely converted to follow the MVC architecture that FuelPHP provides. Some models exist in `/fuel/app/classes/model`, however other functionality is separated into the various managers in the Materia package. Views and controllers, however, are used. Views are in `/fuel/app/views` and controllers are in `/fuel/app/classes/controller`.

<aside>
	Work is being done to migrate to utilizing Models - currently scheduled for the Odin (1.3) release.
</aside>

# Configuration #

The following configuration files are in `/fuel/app/config/`

* The primary config is `config.php` which contains general settings such as caching options, timezone settings, error logging options and so on. Read <a href="http://fuelphp.com/docs/general/configuration.html">FuelPHP's documentation on configuration</a> for more information.
* Database configuration is defined in `db.php` (and `development/db.php` for the development environment, which overrides any settings in `db.php`)
* Materia configuration settings are defined in `materia.php` (and `development/materia.php` for the development environment, which overrides any settings in `materia.php`)

# Permissions system #

## Object Permissions ##

Users have permissions to specific widgets.  There are two permission levels defined in Materia:

* Full: the user has full control over the widget, options, and data.
* View Scores: the user only has permissions to collect score information.

## Roles ##

Materia has a very simple three-role system:

* Admin (role name - super_user): Can see and administer the entire system.
* Instructor (role name - basic_author): Can see and administer their own widgets.
* Student: Can play widgets but not create them.

# User Authentication Modules #

Mateira uses FuelPhp's Auth package to handle basic authentication. This package allows for easy and modular integration with external user data.  View FuelPhp's documentation for details about [writing your own authentication drivers](http://fuelphp.com/docs/packages/auth/drivers.html)

# Unit Tests #

Materia uses FuelPhp's built in unit test functionality.  We have built unit tests for the entire Materia API as well as for each score module. The tests are easily run using oil:

	php oil test