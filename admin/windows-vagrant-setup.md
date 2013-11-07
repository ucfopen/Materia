---
layout: page
title: Windows Vagrant Setup
tagline: Getting up and running on Windows
class: admin
---
{% include JB/setup %}

# Install the basics #

This guide will tell you how to install Git, Ruby, VirtualBox and Vagrant on Windows so you can get started developing for Materia.

* Install [Git](http://git-scm.com/download/win). Install with default settings.
* Download [Ruby Installer for Windows](http://rubyinstaller.org/) (Ruby 1.9.3-p194 at the time of this writing)
* Download [VirtualBox for windows](https://www.virtualbox.org/wiki/Downloads)

## Make sure Ruby is installed ##

* If you run the command ```ruby -v```, you should see a version number printed on the next line
* If not, you will need to add ruby to your path: ```PATH=$PATH:/c/Ruby193/bin``` (your ruby bin folder may difffer)

## Install Vagrant ##

This should be the easy part. Just run ```gem install vagrant``` from the git bash

## Setup Git ##

In case you haven’t already, add your key to Github (and create an account if you don’t have one yet). Use Github’s page on generating an ssh key and setting up git on your computer:

* [Generating ssh keys](https://help.github.com/articles/generating-ssh-keys)
* [Setting up git](https://help.github.com/articles/set-up-git)

## Clone Materia Repo ##

* Clone the repo to your computer. Open up your git bash and navigate or create a folder for the project.
* Run the following command: ```git clone git@github.com:ucfcdl/Materia.git```
* After that has completed, **cd** into the directory it created (probably Materia)
* If you run an ls to list the files, you should see a fuel, oil, public, and vagrant folder

## Run Vagrant ##

* From the materia directory (where the git repo lives), **cd** into the vagrant folder
* Run ```vagrant up```
* At this point, a bunch of commands will run and you will see a lot of output.

## Modify Hosts File ##

* Open notepad as an administrator
* Open the hosts file in ```C:/Windows/System32/drivers/etc/```
* Add the following line and save: ```192.168.33.33 materia``` (Your box's IP will depend on what is in the config.vm.network setting in your Vagrantfile)

## Take a Look ##

At this point, if you navigate from your browser to [Materia](http://materia/), you should see the home page load!

## SSH ##

On a unix envrionment, you can run the command vagrant ssh to ssh into the box (from the vagrant directory). On a Windows machine, however, you have to do it a little differently:

* From the git bash, run the command ```ssh vagrant@materia```
* You will be asked to continue connection. Say yes.
* When prompted for a password, use ```vagrant```

<aside>
	You may need to add <code>extension=php_pdo_mysql.dll</code> to your php.ini file (in /etc/php5/apache2/) for oil to work.
</aside>