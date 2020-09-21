#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Initializes a new Materia environment in Docker

# 1. Clone materia into ./app/
# 2. Get a local copy of the current Docker Images
# 3. Create the containers
# 4. Install php composer dependencies
# 5. Clean the migration files
# 6. Run Materia installer
# 7. Install any widgets in fuel/app/tmp/widget_packages/
# 8. Use Yarn to install js dependencies
# 9. Use Yarn to build js and css
#
# If you find you really need to burn everything down
# Run "docker-compose down" to get rid of all containers
#
# Materia only comes with 2 bare bones widgets for unit tests
# Build your own using ./run_widgets_build.sh
#######################################################
set -e
# set -o xtrace

DOCKER_IP="localhost"

# clean environment and configs
# clean migration files in every environment
rm -f ../fuel/app/config/**/migrations.php

# make room for the cert (docker may make directories here if `up` was run before the certs exist)
rm -rf ./config/nginx/key.pem
rm -rf ./config/nginx/cert.pem

# generate a self-signed ssl cert
openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ./config/nginx/key.pem -out ./config/nginx/cert.pem -days 365

# use env/args to determine which docker-compose files to load
source run_dc.sh

$DC pull --ignore-pull-failures

# install composer deps
$DC run --rm --no-deps phpfpm composer install --ignore-platform-reqs

# setup mysql
$DC run --rm phpfpm /wait-for-it.sh mysql:3306 --timeout=120 --strict -- composer oil-install-quiet

# install all the configured widgets
$DC run --rm phpfpm bash -c 'php oil r widget:install_from_config'

# Install any widgets in the tmp dir
source run_widgets_install.sh '*.wigt'

# build all the js/css assets
source run_build_assets.sh

# create a dev user based on your current user
source run_create_me.sh

echo -e "Materia will be hosted on \033[32m$DOCKER_IP\033[0m"
echo -e "\033[1mRun an oil comand:\033[0m ./run.sh php oil r  widget:show_engines"
echo -e "\033[1mRun the web app:\033[0m docker-compose up"
