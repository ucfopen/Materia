---
layout: page
title: Packaging Widgets with Mako
tagline: Use Mako to build widget packages for distribution.
class: developers
---
{% include JB/setup %}

# Mako Ruby Gem

Mako is a Ruby library used to speed up widget development.  Get started quickly using scaffold, and quickly package and test your widget using build.

# Installation

	gem install mako

# Mako Scaffold

Get started quickly by creating a new widget project.  Mako Scaffold will generate all the folders and configuration files required to build a widget.

	mako scaffold "Mecha Duck Hunt"

Scaffold will create a new directory named "mecha-duck-hunt", filling it with the required file structure.


# Mako Build

*Compiles* a widget for distribution. 

	mako build 

Run from the top directory of your widget. Process your Sass, Less, CoffeeScript, JavaScript, Flash, and HTML.  The compiled and minified results will be zipped into the final .wigt package and ready for instalation.

Mako bulid has quite a few options:

* ```--output, -o <dir>``` specifies a directory to place the .wigt file or pre-packaged files when using ```-k```.
* ```--skip-optimize, -k``` skips minification of css, javascript, and compiles flash with debug set to true.
* ```--skip-package, -i``` Skip creating a .wigt package.  Use for development w/ Materia's Widget Dev Mode.
* ```--watch, -2``` watches the widget source files to continously build less, coffee, and sass files
* ```--configs, -c <dir [dir...]>``` specifies which build.yaml files to use for compilation (default: ./build.yaml)
* ```--target, t <file.swf>``` specifies the generated swf's filename to use for Flash/Flex.
* ```--stop-on-fail, -p``` Stop execution if compiling fails.
* ```--sdk, -s <dir>``` specifies a path to the Flex SDK for compiling Flash/Flex files (defualt: env $MAKO_FLEX_SDK)
* ```--help, -h``` Show this help

# Mako Develop

Places a widget in your Materia Platform Sandbox for testing.

	mako develop dir/to/Materia/static/sandbox/widget-name

Run from the top directory of your widget.  Compiles assets without minifying them and copies the files into your local Sandbox for testing.

Mako develop options:

* ```--sdk, -k <dir>``` specifies a path to the Flex SDK for compiling Flash/Flex files (defualt: env $MAKO_FLEX_SDK)


# Environment Options for Mako

When using Mako to build Flex or Flash widgets, you will need to tell Mako where to find your Flex SDK.  You can do this with the --sdk option for mako build, or set the option in your .bash_profile environment 

	export MAKO_FLEX_SDK="/Applications/Adobe\ Flash\ Builder\ 4.5/sdks/3.6.0/"