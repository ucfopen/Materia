# Materia

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://ucf-open-slackin.herokuapp.com/) [![Join UCF Open Slack Discussions](https://ucf-open-slackin.herokuapp.com/badge.svg)](https://ucf-open-slackin.herokuapp.com/)

## Quick Heroku Deploy

We added Heroku support as an easy way to give Materia a **free test drive** (or scale it up for production use).

[![Deploy Materia to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

> [Heroku](https://www.heroku.com/what) is a cloud service that lets you host web apps in the cloud without having to worry so much about the infrastructure.

# Installation

# Docker

We publish production ready docker and nginx containers in the [Materia Docker repository](https://github.com/orgs/ucfopen/packages/container/package/materia).  For more info on using Docker in Production, read the [Materia Docker Readme](docker/README.md)

# Development

## Local Dev with Docker

Get started with a local dev server:

```
git clone https://github.com/ucfopen/Materia.git

cd Materia/docker

./run_first.sh
```
More info about Materia Docker can be found in the [Materia Docker Readme](docker/README.md)

## Running Tests

Tests run in the docker environment to maintain consistency. View the `run_tests_*.sh` scripts in the docker directory for options.

### Running A single test group

Inspect the actual test command in `/.run_tests.sh` for guidance, but as of the time of writing this, you can run a subset of the tests in the docker environment to save time.

The following command will run just the **Oauth** tests rather quickly:

```
./run_tests.sh --group=Oauth
```

## Git Hooks

There is a pre-commit hook available to ensure your code follows our linting standards. Check out the comments contained inside the hook files (in the githooks directory) to install it, you'll need a few dependencies installed to get linting working.

## Configuring

Configuration settings are handled through environment variables. There are several ways to accomplish changing these settings (yay, flexibility!).  Pick the one that best suits your deployment.

> Note: It is crucial that you don't expose phpinfo() pages to the web. It will display your secrets!
> In development mode, Materia exposes `/dev/php-info`!).

### Configure Using .env

This is the most common approach. Simply copy `.env` to `.env.local` and edit the copy. You'll want to keep a backup of this file!

> Note: Take extra care to make sure .env.local file is not accessable from the web.

### Configure Using NGINX

You can set php environment variables in your NGINX config using the fastcgi_param option.

```
location ~ ^/index.php$ {
    fastcgi_pass  127.0.0.1:9000;
    #... clip ...

    # HERE!
    fastcgi_param FUEL_ENV development;

    # OR in this file
    include fastcgi_params;
}
```

### Configure Using Apache

In your virtual host block, use `SetEnv`

```
SetEnv MY_ENV_VAR_1 'value1'
```

### Configure Using PHPFPM

PHPFPM allows you to add env vars using its config. For example, your config may be located in `/etc/php/fpm/pool.d/www.conf`. Uncomment `clear_env = no` and add your environment variables to the config.  A restart of php-fpm will be required.

```
clear_env = no
env[MY_ENV_VAR_1] = 'value1'
env[MY_ENV_VAR_2] = 'value2'
```

### Manual Override

All of the environment variables are converted into regular FuelPHP configuration options in the files in fuel/app/config. If you prefer, you can edit those files directly, skipping the environment settings all together.  The config path to each setting is in our configuration key below.

### Environment Variables

The config key below shows all of the available environment variables.

> Note: only `BOOL_` options become boolean values. And ONLY `true` evaluates to true.

```
# GENERAL ===================

# always use production when exposed to the web!
FUEL_ENV=production

#db.default.connection
# All your mysql/mariadb connection information in one variable
# format: "mysql://user:pass@host/database"
#DATABASE_URL=<MUST_SET>

#materia.send_emails
# Should Materia send emails (mostly used to notify about sharing widgets)
# Note we use FuelPHP's email classes, additional customization is possible using config/email.php
# [true|false] (default: false)
BOOL_SEND_EMAILS=false

#materia.system_email
# set the from address that materia will send from
#SYSTEM_EMAIL=<MUST_SET>

#config.locale (default: en_US.UTF-8)
# google `php setlocale` for more info
#FUEL_LOCAL=en_US.UTF-8

#config.always_load.packages
# list of fuelphp packages to always load at startup. Custom auth modules may need to be registred here
# default: ("orm,auth,materiaauth,ltiauth")
# comma separated
#FUEL_ALWAYS_LOAD_PACKAGES="orm,auth,materiaauth,ltiauth"

#config.always_load.modules
# default:("")
# comma separated
#FUEL_ALWAYS_LOAD_MODULES=""

# LOGGING ===================

#config.log_threshold
# Threshold for for which types of logs get written
# [0|99|100|200|300|400]
# (default:300)
# L_NONE=0, L_ALL=99, L_DEBUG=100, L_INFO=200, L_WARNING=300, L_ERROR=400
#FUEL_LOG_THRESHOLD=300

#config.log_handler
# Optionaly set the log handler to stdout (like when you're using docker)
# [STDOUT|DEFAULT]
#LOG_HANDLER=DEFAULT

# ASSETS ===================

#materia.urls.static
# Highly suggested, but not required, second domain to host static assets from.
# 1: it provides a cross-domain boundry to protect Materia Server from widget javascript
# 2: you can use this to load those assets via a CDN - speed!
# default is dynamic - \Uri::create()
#URLS_STATIC=

#materia.urls.engines
# Highly suggested, but not required, second domain to host static assets from.
# 1: it provides a cross-domain boundry to protect Materia Server from widget javascript
# 2: you can use this to load those assets via a CDN - speed!
# default is dynamic - \Uri::create('widget/')
#URLS_ENGINES=

#materia.enabled_admin_uploader
# This will allow admin users to install & update widgets by uploading them in the admin interface
# You may wish to disable this if you prefer more control, or use a CI/CD pipeline to install them
# [true|false]
# (default: true)
#BOOL_ADMIN_UPLOADER_ENABLE=true

#materia.asset_storage_driver
# Where to store author uploaded media? file is easy. db is easy & works when running multiple Materia servers. s3 is harder to set up, but efficient and multi-server friendly. Do not use file on Heroku.
# [file|db|s3]
# (default: file)
#ASSET_STORAGE_DRIVER=file

#materia.asset_storage.s3.region
# Which s3 region should be used to upload
# (default: us-east-1)
#ASSET_STORAGE_S3_REGION=us-east-1

#materia.asset_storage.s3.bucket
# Which bucket should assets be uploaded to - it will need to be public!
#ASSET_STORAGE_S3_BUCKET=

#materia.asset_storage.s3.subdir (default: media)
# Basepath to add to uploaded media. Unlikely you'll need to change this
#ASSET_STORAGE_S3_BASEPATH=

#materia.asset_storage.s3.key
# AWS Access Key, suggest creating a key with very restricted access!
#ASSET_STORAGE_S3_KEY=

#materia.asset_storage.s3.secret_key
# Secret for the above Access Key.
#ASSET_STORAGE_S3_SECRET=

# SESSION & CACHE ===================
# Where to store app cache. file is an easy default if you don't have a memcached server. file is OK on Heroku.
#cache.driver: [memcached|file] (default: file)
#CACHE_DRIVER=file

# cache.memcached.servers.default.host & session.memcached.servers.default.host
# if you're using memcached for cache or sessions, what domain is it accessible from?
# (default: localhost)
#MEMCACHED_HOST=localhost

# cache.memcached.servers.default.port & session.memcached.servers.default.port
# if you're using memcached for cache or sessions, what port is it accessible from?
# (default: 11211)
#MEMCACHED_PORT=11211

#session.driver
# Where to keep user sessions? file = easy, db = multi-server support, memcached = fast! & multiserver! Do not use file on Heroku.
# [db|file|memcached]
# (default: file)
#SESSION_DRIVER=file

#session.expiration_time
# how long before sessions expire? Comment out for unlimited.
# (default: unlimited)
SESSION_EXPIRATION=21600

# THEME ===================

#theme.active
# Custom themes can be provided to override how Materia looks using FuelPHP's themes
# (default: <empty>)
# see github.com/ucfopen/Materia-Theme-UCF for example
#THEME_ACTIVE=

#theme.custom_path (default: <empty>)
# Tell FuelPHP where your custom themes are located
#THEME_PACKAGE=

# AUTH ===================

#auth.drivers:
# Register custom auth drivers (They can be used to enable SAML or external database lookups)
# (default: Materiaauth)
# comma separated, no spaces
#AUTH_DRIVERS=Materiaauth

#auth.salt:
# A string used to salt older Materia Servers
# Upgrades from Materia 7.0.1 or earlier: copy from existing fuel/app/config/auth.php
# Create one: `docker-compose run --rm app php -r "echo(sodium_bin2hex(random_bytes(SODIUM_CRYPTO_STREAM_KEYBYTES)));"`
#AUTH_SALT=<MUST_SET>

#simpleauth.login_hash_salt
# A string used to salt older Materia Servers
# Upgrades from Materia 7.0.1 or earlier: copy from existing fuel/app/config/crypt.php
# Create one for new installs: `docker-compose run --rm app php -r "echo(sodium_bin2hex(random_bytes(SODIUM_CRYPTO_STREAM_KEYBYTES)));"`
#AUTH_SIMPLEAUTH_SALT=<MUST_SET>

# DEFAULT USERS ===================

# materia.default_users[0].password
# By default materia creates 3 default users. This is a system user that must be created
# (default: random)
#USER_SYSTEM_PASSWORD

# materia.default_users[1].password
# By default materia creates 3 default users. This is a sample instructor
# (default: random)
#USER_INSTRUCTOR_PASSWORD

# materia.default_users[2].password
# By default materia creates 3 default users. This is a sample student
# (default: random)
#USER_STUDENT_PASSWORD

# CRYPTO ===================

#crypto.key
# A string used to salt older Materia Servers
# Upgrades from Materia 7.0.1 or earlier: copy from existing fuel/app/config/crypt.php
# Create one: `docker-compose run --rm app php -r "echo(sodium_bin2hex(random_bytes(SODIUM_CRYPTO_STREAM_KEYBYTES)));"`
#CRYPTO_KEY=<MUST_SET>

#crypto.iv
# A string used to salt older Materia Servers
# Upgrades from Materia 7.0.1 or earlier: copy from existing fuel/app/config/crypt.php
# Create one: see crypto.key instructions
#CRYPTO_IV=<MUST_SET>

#crypto.hmac
# A string used to salt older Materia Servers
# Upgrades from Materia 7.0.1 or earlier: copy from existing fuel/app/config/crypt.php
# Create one: see crypto.key instructions
#CRYPTO_HMAC=<MUST_SET>

#crypto.sodium.cipherkey
# A special cipher used to encrypt newer fuelphp data using lib sodium.
# Create one: see crypto.key instructions
#CIPHER_KEY=<MUST_SET>

# LTI ===================

#auth.restrict_logins_to_lti_single_sign_on
# If set to true, users will ONLY be able to log in through your LMS.
# [true|false]
# (default: false)
#BOOL_LTI_RESTRICT_LOGINS_TO_LAUNCHES=false

#lti.tool_consumer_instance_guid
# see `tool_consumer_instance_guid` http://www.imsglobal.org/specs/ltiv1p1/implementation-guide
#LTI_GUID=

#lti.consumers.default.tool_id
# see `tool_id` https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
#LTI_TOOL_ID=

#lti.consumers.default.course_nav_default
# Should Materia show up in the course nav by default?
# [true|false]
# (default: false)
#BOOL_LTI_COURSE_NAV_DEFAULT=false

#lti.consumers.default.key
# What is the LTI Public Key for your LMS Integration
LTI_KEY="materia-production-lti-key"

#lti.consumers.default.secret
# What is the LTI Secret For your LMS Integration
#LTI_SECRET=<MUST_SET>

#lti.consumers.default.remote_username
# Which one of the LTI Launch paramaters do you want to use as a username in Materia?
# See https://canvas.instructure.com/doc/api/file.tools_xml.html
# pick any lti launch param
# (default: lis_person_sourcedid)
#LTI_REMOTE_USERNAME=

#lti.consumers.default.remote_identifier
# Which one of the LTI Launch paramaters do you want to use as a username in Materia?
# See https://canvas.instructure.com/doc/api/file.tools_xml.html
# (default: lis_person_sourcedid)
#LTI_REMOTE_IDENTIFIER=

#lti.consumers.default.creates_users
# Should LTI launches new users create new users?
# [true|false]
# (default: true)
#BOOL_LTI_CREATE_USERS=true

#lti.consumers.default.use_launch_roles
# Should LTI launches change the user's role for Instructors & Students?
# [true|false]
# (default: true)
#BOOL_LTI_USE_LAUNCH_ROLES=true


#lti.graceful_fallback_to_default
# If an lti configuration for a specific provider isn't present, should Materia use the default configuration?
# The default is set in lti.consumers.default.  If false, a consumer must be defined that matches the lti launch param 'tool_consumer_info_product_family_code'. For example: if the family code is 'canvas', a config must exist for lti.consumers.canvas.
# Using default is a nice option for simplicity, but it's advisable to use a different key and secret for each family_code.
# [true|false]
# (default: true)
#BOOL_LTI_GRACEFUL_CONFIG_FALLBACK=true

```
