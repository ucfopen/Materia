---
layout: page
title: Deploying Materia
tagline: For development &amp; production
class: admin
---
{% include JB/setup %}

<aside>
	These instructions refer to and link to internal UCF resources.
</aside>

# Development - Docker Install

We have a Docker container which automates the process of getting a working Materia installed on your development machine.

The container, install instructions and software requirements can be found [in this repository](https://clu.cdl.ucf.edu/materia/materia-docker).

# Production - Server Install

Our Docker container is not ready for production use. For now you'll want to setup your server with the requirements defined [here](/admin/server-requirements.html).

# Domain Setup #

Materia is designed to run from two domains.  One for the web application, and one for the static assets.  This separation is important create a restricted sandbox for the widget engines to run inside.  It also helps us speed up Materia.  We know in testing environments that this may be tedious.  It is possible to host the static sites from the same domain on a non standard port, or just host everything from one domain on port 80.  Fortunately, Materia's configuration will allow all of these with some creative manipulation of the `materia.urls` config options.

## Different domain

This is how we recommend running in production.

	// where is the css/js
	'static'  => 'https://static.mymateria.example/',
	 // where are the widget files
	'engines' => 'https://static.mymateria.example/widgets/',
	// allows static domain to talk to materia
	'static'  => 'https://static.mymateria.example/',


## Same domain, different port

The example below will dynamically add port :8080 to the current domain.

	// where is the css/js
	'static' => preg_replace('/(https?:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8080${3}', \Uri::create()),
	 // where are the widget files
	'engines' => preg_replace('/(https?:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create('widget/')),
	// allows static domain to talk to Materia
	'static_crossdomain' => preg_replace('/(https?:\/\/.+?)(\:[0-9]*){0,1}(\/.*)/', '${1}:8008${3}', \Uri::create()),

## Same domain, same port

We'll need to move some files around to host static stuff from the same domain.  Either symlink `/static` so it's available at `/public/static` or move the directory all together, then use the settings below:

	// where is the css/js
	'static'  => \Uri::create('static/'),
	 // where are the widget files
	'engines' => \Uri::create('static/widget/'),
	// allows static domain to talk to Materia
	'static'  => \Uri::create('static/'),
