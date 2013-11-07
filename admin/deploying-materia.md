---
layout: page
title: Deploying Materia
tagline: For development &amp; production
class: admin
---
{% include JB/setup %}

# 5 Minute Install #

If you want to demo, test, or develop for Materia, you can easily get a virtual web server running in a few minutes. Depending on your currently installed software, and internet connection speed, you can be plugging away at your own Materia in less than 5.

## Prerequisites ##

[Vagrant](http://vagrantup.com/) creates and configures development virtual machines (it's super awesome)
[Virtual Box](https://www.virtualbox.org/) integrates with Vagrant to host virtual machines on your computer
[Git](http://git-scm.com/) manages all of our source code.

<aside>
	OSX and other Unix based installs should be pretty straightforward, however
	<a href="windows-vagrant-setup.html">Windows requires a few unique steps</a>
	to get everything running.
</aside>

## Download and Startup ##

Clone the repository, submodules, and start the virtual machine:

<pre><code class="bash">git clone --recursive https://github.com/ucfcdl/Materia.git
cd Materia/vagrant
vagrant up
</code></pre>

The code above automates a lot of setup tasks you'd normally need an IT staff for, check it out:

1. Downloads Materia's source code and related libraries
2. Downloads a 64bit Ubuntu Linux image.
3. Starts a Ubuntu virtual machine.
4. Downloads and installs all required software for the server (Apache, Php etc).
5. Sets up Materia's directory permissions.
6. Initializes the Materia databases.
7. Creates an admin user with a random password.
8. Installs the core widget library.

When it's complete, you'll have a working Materia server. Navigate to <a target="_blank" href="http://192.168.33.33">http://192.168.33.33</a> to see your install once it's finished.

<aside>
	You can specify a different IP address (among many other options) in the Vagrant File: `/vagrant/Vagrantfile`
</aside>

# Production install #

Materia is a typical webapp utilizing the LAMP stack (take a look at the [server requirements]({{BASE_PATH}}/develop/server-requirements.html#production)). It can work on shared hosts, virtual machines, and cloud services like AWS.

Materia is build to live on its own domain or subdomain.

## Apache Notes ##
You'll want to host the project outside of a web-accessible directory but point your Materia URL to the web-accessible `public` directory. Take a look at `/vagrant/cookbooks/materia/templates/default/web_app.conf.erb` as an example.

<aside>
	If you do not have AllowOverrides on you will need to copy the .htaccess rules from `/public/.htaccess` to your Apache config.
</aside>

# Domain Setup #

Materia is designed to run from two domains.  One for the web application, and one for the static assets.  However, the speed and security benefits may outweigh the setup requirements in your environment.  If that is the case, the configuration options in Materia allow you to run the static domain on the application domain.

<pre><code class="bash"># links http://materia.com/static to the static directory
$ ln -s your_path_to_materia/static your_path_to_materia/public/static
# links http://materia.com/js to the static/js directory
$ ln -s your_path_to_materia/static/js your_path_to_materia/public/js
</code></pre>

Then update the configuration to route requests to the correct location.  Edit your fuel/app/config/development/materia.php or production/materia.php configuration file, adding the following:

<pre><code class="php">//Change the default static urls to use one domain instead of two
'urls' => array(
	'static'  => \Uri::create('static/'), // http://static.siteurl.com/
	'engines' => \Uri::create('static/widget/'), // engine swf locations
),
</code></pre>