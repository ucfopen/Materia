---
layout: page
title: Server Requirements
tagline: What's needed to get Materia running
class: admin
---
{% include JB/setup %}

# Production Server #

The ideal server environment would look something like this.

* Unix (Solaris, Ubuntu, and more?)
* PHP 5.4
* MySQL 5+
* Apache 2 Webserver
* mod_php5
* mod_rewrite
* mod_xsendfile (reccomended)
* pecl oauth (optional for lti integration)

<aside>
	Materia may work on other platforms that support apache and mysql, but we have only used it on Solaris and Ubuntu.
</aside>

# Development and Testing Environments #

To build and test Materia, theres a few more tools to make everything easier.

* [Vagrant](http://www.vagrantup.com/)
* phpunit

<aside>
	If you want to demo, test, or develop for Materia, check out the <a href="/admin/deploying-materia.html#5-minute-install">5 Minute Install</a>. We've included tools to automate everything.
</aside>