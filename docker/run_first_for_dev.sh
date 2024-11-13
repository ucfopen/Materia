#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Initializes a new local Dev Materia environment in Docker
# This script is dev focused! Docker will volume mount your local project to facilitate
# easier development. If you're looking to initialize a Materia instance to eventually
# work in a production environment, use run_first_for_nondev.sh instead
#
# If you find you really need to burn everything down
# Run "docker compose down" to get rid of all containers
#
#######################################################
set -e
# set -o xtrace

DOCKER_IP="localhost"

cp docker-compose.development.yml docker-compose.override.yml

# Clean migration files in every environment so they can run again
rm -f ../fuel/app/config/**/migrations.php

# Clear out any existing certs
rm -rf ./config/nginx/key.pem
rm -rf ./config/nginx/cert.pem

# Create a .env.local if one isn't present in the docker dir
if [ ! -f .env.local ]; then
	touch .env.local
fi

# Generate a self-signed ssl cert
openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ./config/nginx/key.pem -out ./config/nginx/cert.pem -days 365

echo "
 __    __     ______     ______   ______     ______     __     ______    
/\ \-./  \   /\  __ \   /\__  _\ /\  ___\   /\  == \   /\ \   /\  __ \   
\ \ \-./\ \  \ \  __ \  \/_/\ \/ \ \  __\   \ \  __<   \ \ \  \ \  __ \  
 \ \_\ \ \_\  \ \_\ \_\    \ \_\  \ \_____\  \ \_\ \_\  \ \_\  \ \_\ \_\ 
  \/_/  \/_/   \/_/\/_/     \/_/   \/_____/   \/_/ /_/   \/_/   \/_/\/_/ 
"

echo "This is the setup script for local Materia development. If you just want to try things out, use run_first_for_nondev.sh instead."
echo "To setup Materia locally, you can choose to pull pre-packaged images or build from source"
echo "1. Pull app and webserver images (recommended and faster)"
echo "2. Build images from source (good for active development of Materia locally)"
read -p "Enter an option (1 or 2): " choice

if [ "$choice" == "1" ]; then
	echo "Pulling containers..."
	# quietly pull any docker images we can
	docker compose pull

elif [ "$choice" == "2" ]; then
	echo "Building containers. This will take a few minutes..."
	docker compose build app webserver fakes3
else
	echo "Invalid choice. Try again."
	exit 1
fi

# Install php composer deps
# Even though these are present on the images already, the assets don't exist locally
# When docker compose volume mounts the project, the local filesystem takes precedence
# As such it's required to rerun this process to bring the host machine into parity
docker compose run --rm --no-deps app composer install --ignore-platform-reqs

# Run migrations and seed any db data needed for a new install
docker compose run --rm app /wait-for-it.sh mysql:3306 --timeout=120 --strict -- composer oil-install-quiet

# Install the preconfigured default widgets
docker compose run --rm app bash -c 'php oil r widget:install_from_config'

# Install any widgets in the tmp dir
source run_widgets_install.sh '*.wigt'

# Same deal as composer: the assets are available in the images but not locally
source run_build_assets.sh

# create a dev user based on your current shell user (password will be 'kogneato') MATERIA_DEV_PASS=whatever can be used to set a custom pw
source run_create_me.sh

echo -e "Materia will be hosted on \033[32m$DOCKER_IP\033[0m"
echo -e '\033[1mRun an oil comand:\033[0m ./run.sh php oil r  widget:show_engines'
echo -e '\033[1mRun the web app:\033[0m docker compose up'
echo -e 'Doing local js/css dev? Be sure to \033[1myarn install\033[0m and \033[1myarn dev\033[0m to run the local webpack dev server'
