#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Initializes a new local Dev Materia environment in Docker
#
# If you find you really need to burn everything down
# Run "docker-compose down" to get rid of all containers
#
#######################################################
set -e
# set -o xtrace

DOCKER_IP="localhost"

# clean migration files in every environment so they can run again
rm -f ../fuel/app/config/**/migrations.php

# clear out any existing certs
rm -rf ./config/nginx/key.pem
rm -rf ./config/nginx/cert.pem

# generate a self-signed ssl cert
openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ./config/nginx/key.pem -out ./config/nginx/cert.pem -days 365

# quietly pull any docker images we can
docker-compose pull --ignore-pull-failures

# install php composer deps
docker-compose run --rm --no-deps app composer install --ignore-platform-reqs

# run migrations and seed any db data needed for a new install
docker-compose run --rm app /wait-for-it.sh mysql:3306 --timeout=120 --strict -- composer oil-install-quiet

# install all the configured widgets
docker-compose run --rm app bash -c 'php oil r widget:install_from_config'

# Install any widgets in the tmp dir
source run_widgets_install.sh '*.wigt'

# build all the js/css assets
source run_build_assets.sh

# create a dev user based on your current shell user (password will be 'kogneato') MATERIA_DEV_PASS=whatever can be used to set a custom pw
source run_create_me.sh

echo -e "Materia will be hosted on \033[32m$DOCKER_IP\033[0m"
echo -e "\033[1mRun an oil comand:\033[0m ./run.sh php oil r  widget:show_engines"
echo -e "\033[1mRun the web app:\033[0m docker-compose up"
