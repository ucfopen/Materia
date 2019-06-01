#!/bin/bash
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

# store the docker compose command to shorten the following commands
DC="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"

$DC pull --ignore-pull-failures

# install composer deps
docker-compose run --rm --no-deps phpfpm composer install

# setup mysql
docker-compose run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- composer oil-install-quiet

# install all the configured widgets
docker-compose run --rm phpfpm bash -c 'php oil r widget:install_from_config'

# Install any widgets in the tmp dir
source run_widgets_install.sh '*.wigt'

# build all the js/css assets
source run_build_assets.sh

# create a dev user based on your current user
source run_create_me.sh

echo -e "Materia will be hosted on \033[32m$DOCKER_IP\033[0m"
echo -e "\033[1mRun an oil comand:\033[0m ./run.sh php oil r  widget:show_engines"
echo -e "\033[1mRun the web app:\033[0m docker-compose up"
