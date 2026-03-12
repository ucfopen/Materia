# Materia

Materia is a platform and ecosystem for small, self-contained, customizable e-learning applications called _widgets_, designed to enhance digital course content. Widgets in the catalog can be customized by instructors to suit their instructional goals and objectives, then shared with students directly or embedded in an LMS through LTI.

Materia and its associated library of widgets is an open-source project of the University of Central Florida's Center for Distributed Learning.

# This repo is for the Materia Django Rewrite. You might be looking for [ucfopen/Materia](https://github.com/ucfopen/Materia) instead.

This version of Materia is **heavily work-in-progress**. You have been warned.

## Setup and installation

We recommend cloning this repository alongside the PHP version of Materia. The two can coexist, and you will probably need PHP Materia to reference the original codebase:

#### Clone the repo and check out django-working

```
$ mkdir materia-django
$ git clone git@github.com:ucfcdl/Materia.git materia-django
$ git checkout django-working
```

#### Update environment variables

```
$ cp docker/.env_template docker/.env
```

In `.env`, be sure to update the following values:
```
BASE_URL = http://127.0.0.1/
MEDIA_URL = http://127.0.0.1/media/
MEDIA_UPLOAD_URL = http://127.0.0.1/media/upload/
WIDGET_URL = http://127.0.0.1/widget/
STATIC_CROSSDOMAIN = http://127.0.0.1/
SESSION_DRIVER="redis"
ASSET_STORAGE_DRIVER="file"
```

You can replace `http://127.0.0.1/` with your preferred local address.

#### Set up local containers

If you have `make` available, you can use the paired Makefile to easily run certain commands.

```
$ make build
$ make start
```

Alternatively, run the docker compose commands directly:
```
$ docker compose build
$ docker compose up
```

#### Compile front-end assets

You'll need `yarn` 1.x to compile front-end assets if you're building images from source:
```
$ yarn install
$ yarn build
```

You can also run `yarn dev` to enable auto-compilation of asset files with webpack dev server:
```
$ yarn dev
```

#### Run post-install commands

Run the `post-install` make command to quickly perform post-install server configurations:
```
$ make post-install
```

Alternatively, you can manually use `docker exec` to get shell access to the python container:
```
$ docker exec -it materia-django-python-1 sh
```

Then run the following manage commands:
```
$ python manage.py migrate
$ python manage.py post-install populate_default_groups
$ python manage.py post-install populate_dateranges 2020 2032
$ python manage.py createsuperuser
```

#### Create User Records

Lastly, you'll probably want to create a non-superuser user.

1. Log in to `https://127.0.0.1/admin` (replacing the base URL with your own, if required) as your super user.
2. Select "+Add" button next to Users on the left to create a new user with username and password. Select Save.
3. Edit the new user by selecting the row. Add a first name, last name, and email. Under permissions, add "basic_author" and optionally "support_user". Select Save.

#### Installing Widgets

A management command exists to install widgets from config, but the widgets will not yet contain python score modules. Widgets with python score modules are currently tracked [as issues in the ucfcdl/Materia repo](https://github.com/ucfcdl/Materia/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22Widget%20Score%20Module%22) under the "Widget Score Module" tag.

The easiest way to install widgets is to visit the widget admin panel as your superuser.

### Using pyenv

[Install pyenv](https://github.com/pyenv/pyenv?tab=readme-ov-file#installation).
[Install pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv?tab=readme-ov-file#installation).
Using `pyenv`, make sure the required version of Python is installed and available. This may change over time.

Keep in mind also that the following exports may be necessary in order to properly enable pyenv:
```
# pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
```

### Using Make

Make sure [make](https://www.gnu.org/software/make/manual/make.html) is installed. Typically you can confirm this by checking the output of `which make` in *nix systems. Otherwise, it's up to you to determine how to use Makefiles on your operating system.

Several `make` commands are provided for your convenience:
 * `make dev-check` will check to ensure that the requisite tools `pyenv` and `pyenv-virtualenv` are installed, as well as the required version of Python. If any of the prerequisites are unavailable, you will be notified.
 * `make dev-setup` will, assuming all requirements in `dev-check` pass, automatically create a local dev environment with `pyenv` and `virtualenv`, install all necessary Python packages, and install pre-commit hooks.

Run `make help` to see a full list of commands that will simplify linting your code, running migrations, or starting interactive shell sessions within the container.

## Using LTI

Testing your local instance with LTI is a lot of work - it requires setting up a proxy like ngrok and having appropriate permissions with an LMS (currently just Canvas). You must be able to set up an LTI developer key in your LMS instance as well as having authorship access to a course.

1. Install and configure ngrok. Initialize it by running `ngrok http http://your-local-materia-instance`. You may want to enable "static domain" by selecting the static domain name under "Deploy your app online" from the ngrok web dashboard.
2. Update your `.env` file with the URL the ngrok process is hosting from: `BASE_URL`, `MEDIA_URL`, `MEDIA_UPLOAD_URL`, `WIDGET_URL`, and `STATIC_CROSSDOMAIN`. You will have to restart your python container after setting these values.
3. SSH into the Materia Django docker container and Create a new LTI-related key by running: `python manage.py rotate_keys`.
4. Create a new developer LTI key in your Canvas instance. Select the configure method "Paste JSON," and copy the json content provided at https://your-ngrok-instance.ngrok-free.app/lticonfig. Note that we will have to revisit the configuration in a later step once we have a registration UUID.
5. Save the developer key and toggle it to ON.
6. Copy the number formatted as "1000000000XXXX" in the developer keys details column. This is the tool's Client ID.
7. With a superuser account, visit the Materia django admin page. Create a new LTI registration with the following values:
    - Name: This is the name of the registration. This can be anything you want, but it should be descriptive enough to identify the registration later. We recommend naming after your platform.
    - Client ID: This is the client ID for the tool. This will be generated by Canvas when you create a developer key.
    - Issuer: This is the issuer for the tool. For Canvas, this is https://canvas.instructure.com.
    - Auth URL: This is the URL for the authentication endpoint. For Canvas, this is https://\<your-canvas-domain>\/api/lti/authorize_redirect.
    - Access Token URL: This is the URL for the access token endpoint. For Canvas, this is https://\<your-canvas-domain>\/login/oauth2/token.
    - Keyset URL: This is the URL for the keyset endpoint. For Canvas, this is https://\<your-canvas-domain>\/api/lti/security/jwks.
8. Set to is active to allow the registration to be used. Save the registration.
9. Reload your https://your-ngrok-instance.ngrok-free.app/lticonfig, which should have several updated values now that the Canvas registration has a UUID. Copy the JSON.
10. Revisit the new developer LTI key in Canvas and replace the pasted JSON with the updated version. Copy the client ID again once saved.
11. Visit the settings page for the course you want to use Materia in. Select "Apps" and add a new app. Select "By client ID" and enter the Client ID previously copied from the developer keys page.
12. Copy the Deployment ID of the tool once installed. Visit the django admin panel again and paste the developer key in the first row under "Deployments" at the bottom. Select "Is Active" and select Canvas as the platform instance (if you don't see any platforms yet - don't worry about it.)

Materia should be available in your course now. You can enable it in course navigation or select it as an external tool in a new assignment.
