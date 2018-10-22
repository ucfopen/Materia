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

NODE_DC_COMMAND="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"
DOCKER_IP="localhost"

# docker-compose pull

# create and migrate the database
docker-compose build

# create the contaners and setup networking
docker-compose create

# install composer deps
docker-compose run --rm phpfpm composer install

# run install if migration file is not there
# sometimes it's left behind when copying or re-installing
# it needs to be removed for install to work correctly
if [ -f  ../fuel/app/config/development/migrations.php ]; then
	rm -f ../fuel/app/config/development/migrations.php
fi

# setup mysql
docker-compose run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- composer oil-install-quiet

# install all the configured widgets
docker-compose run --rm phpfpm bash -c 'php oil r widget:install_from_config'

# Install any widgets in the tmp dir
docker-compose run --rm phpfpm bash -c 'php oil r widget:install fuel/app/tmp/widget_packages/*.wigt'

source run_assets_build.sh

# run that beast
# Use docker or set up the docker-machine environment
echo -e "Materia will be hosted on \033[32m$DOCKER_IP\033[0m"
echo -e "\033[1mBuild Assets:\033[0m ./run_assets_build.sh"
echo -e "\033[1mRun an oil comand:\033[0m ./run.sh php oil r  widget:show_engines"
echo -e "\033[1mRun the web app:\033[0m docker-compose up"
