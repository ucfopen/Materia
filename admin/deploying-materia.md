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

Materia is designed to run from two domains.  One for the web application, and one for the static assets.  However, the speed and security benefits may outweigh the setup requirements in your environment.  If that is the case, the configuration options in Materia allow you to run the static domain on the application domain.

<pre><code class="bash"># links http://materia.com/static to the static directory
$ ln -s your_path_to_materia/static your_path_to_materia/public/static
</code></pre>

Then update the configuration to route requests to the correct location.  Edit your fuel/app/config/development/materia.php or production/materia.php configuration file, adding the following:

<pre><code class="php">//Change the default static urls to use one domain instead of two
'urls' => array(
	'static'  => \Uri::create('static/'), // http://static.siteurl.com/
	'engines' => \Uri::create('static/widget/'), // engine swf locations
),
</code></pre>