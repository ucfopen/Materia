#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Initializes a new local Materia environment in Docker
# This script skips some of the dev stuff, like volume mounting your local project into the container
# It is NOT recommended for local dev, but ideal for just trying out Materia or eventually transitioning
# to a prod environment.
# 
# If you're looking to initialize a Materia instance for development, use
# run_first_for_dev.sh instead.
#
# If you find you really need to burn everything down
# Run "docker compose down" to get rid of all containers
#
#######################################################

# Check if yq is available
if ! command -v yq >/dev/null 2>&1; then
	echo "Error: This script requires yq to modify YAML files."
	echo "To install yq:"
	echo "  Linux: sudo wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq && sudo chmod +x /usr/local/bin/yq"
	echo "  macOS: brew install yq"
	echo "For other installation options, visit: https://github.com/mikefarah/yq#install"
	exit 1
fi

set -e

cp docker-compose.development.yml docker-compose.override.yml

# Clean migration files in every environment so they can run again
rm -f ../fuel/app/config/**/migrations.php

# Clear out any existing certs
rm -rf ./config/nginx/key.pem
rm -rf ./config/nginx/cert.pem

# Create a .env.local if one isn't present in the docker dir
if [ ! -f .env.local ]; then
	touch .env.local
else
	cp .env.local .env.local.bak
	> .env.local
fi

# set fuel env to production, since this is explicitly non-dev
echo "FUEL_ENV=production" >> .env.local

# Generate a self-signed ssl cert
openssl req -subj '/CN=localhost' -x509 -newkey rsa:4096 -nodes -keyout ./config/nginx/key.pem -out ./config/nginx/cert.pem -days 365

echo "
 __    __     ______     ______   ______     ______     __     ______    
/\ \-./  \   /\  __ \   /\__  _\ /\  ___\   /\  == \   /\ \   /\  __ \   
\ \ \-./\ \  \ \  __ \  \/_/\ \/ \ \  __\   \ \  __<   \ \ \  \ \  __ \  
 \ \_\ \ \_\  \ \_\ \_\    \ \_\  \ \_____\  \ \_\ \_\  \ \_\  \ \_\ \_\ 
  \/_/  \/_/   \/_/\/_/     \/_/   \/_____/   \/_/ /_/   \/_/   \/_/\/_/ 
"

echo "This script is intended for users who are looking to try out Materia locally and potentially transition to a prod environment."
echo "For local development, use run_first_for_dev.sh instead."
echo "This install process will prompt you for a few configuration choices along the way. These can always be changed later."
echo ""

docker compose pull app webserver

# Remove the fakes3 service from the docker-compose override
yq e 'del(.services.fakes3)' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
yq e 'del(.services.app.depends_on[] | select(. == "fakes3"))' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Clean volume mounts from the app service
yq e 'del(.services.app.volumes)' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Re-apply the widgets volume to the app service
yq e '.services.app.volumes += ["../public/widget/:/var/www/html/public/widget/:rw"]' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Add an additional compiled_assets volume definition
yq e '.volumes.compiled_assets = {}' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Add compiled_assets volume to the app service
yq e '.services.app.volumes += ["compiled_assets:/var/www/html/public"]' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Remove the host machine public mount from the webserver definition
yq e 'del(.services.webserver.volumes[] | select(. == "../public:/var/www/html/public:ro"))' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Remove port 8008 from the port mounts on the webserver service
yq e 'del(.services.webserver.ports[] | select(. == "8008:8008"))' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
# Add compiled_assets volume to the webserver service
yq e '.services.webserver.volumes += ["compiled_assets:/var/www/html/public"]' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml

# Update nginx config to use non-dev configuration
yq e '(.services.webserver.volumes[] | select(contains("nginx-dev.conf"))) |= sub("nginx-dev.conf", "nginx-nondev.conf")' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml

echo ""
echo "What local IP will you be using to connect to your docker instance?"
echo "The default is localhost"
read -p "Provide your local docker address or press enter to use localhost:" docker_ip

if [ "$docker_ip" == "" ]; then
	docker_ip="localhost"
fi

echo ""
echo "docker ip set to $docker_ip: writing URLS_STATIC and URLS_ENGINES to local env"

# update the url env variables
echo "URLS_STATIC=https://$docker_ip/" >> .env.local
echo "URLS_ENGINES=https://$docker_ip/widget/" >> .env.local

echo ""
echo "Do you want to:"
echo "1. Use and populate a local database container"
echo "2. Connect to an external db"
read -p "Enter an option (1 or 2): " db_choice

if [ "$db_choice" == "1" ]; then
	echo "A local mysql container will be spun up and populated."
	echo "Note that this is not recommended for production use."
	docker compose pull mysql
	
	# Ensure the volumes section exists before adding the wait-for-it.sh volume mount
	yq e '.services.app.volumes = (.services.app.volumes // [])' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
	yq e '.services.app.volumes += ["./dockerfiles/wait-for-it.sh:/wait-for-it.sh"]' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml

elif [ "$db_choice" == "2" ]; then
	echo "You'll need to update your db config in Materia to use an external db."
	echo "Guidance will be provided at the end of this process."
	
	# Remove mysql service and its dependencies
	yq e 'del(.services.mysql)' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
	yq e 'del(.services.app.depends_on[] | select(. == "mysql"))' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml

else
	echo "Invalid choice."
	exit 1
fi

echo ""
echo "File cache driver selection: where are server-side files cached?"
echo "1. memcached (default for local dev)"
echo "2. file"
read -p "Enter an option (1 or 2): " cache_driver_choice

if [ "$cache_driver_choice" == "1" ]; then
	echo "Setting CACHE_DRIVER env variable to memcached"
	echo "CACHE_DRIVER=memcached" >> .env.local

elif [ "$cache_driver_choice" == "2" ]; then
	echo "Setting CACHE_DRIVER env variable to file"
	echo "CACHE_DRIVER=file" >> .env.local

else
	echo "Invalid choice."
	exit 1
fi

echo ""
echo "Next, let's select the session driver: where will the server store user session information?"
echo "1. memcached (default for local dev)"
echo "2. file"
echo "3. db"
read -p "Enter an option (1, 2, or 3): " session_driver_choice

if [ "$session_driver_choice" == "1" ]; then
	echo "Setting SESSION_DRIVER env variable to memcached"
	echo "SESSION_DRIVER=memcached" >> .env.local

elif [ "$session_driver_choice" == "2" ]; then
	echo "Setting SESSION_DRIVER env variable to file"
	echo "SESSION_DRIVER=file" >> .env.local

elif [ "$session_driver_choice" == "3" ]; then
	echo "Setting SESSION_DRIVER env variable to db"
	echo "SESSION_DRIVER=db" >> .env.local

else
	echo "Invalid choice."
	exit 1
fi

# only remove the memcached service if BOTH session and cache drivers are not memcached
if [ "$cache_driver_choice" != "1" ] && [ "$session_driver_choice" != "1" ]; then
	yq e 'del(.services.memcached)' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
	yq e 'del(.services.app.depends_on[] | select(. == "memcached"))' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml
fi

echo ""
echo "Finally, let's select the asset storage driver: where user-uploaded media will be stored."
echo "1. file"
echo "2. db (not recommended at scale)"
read -p "Enter an option (1 or 2): " asset_driver_choice

if [ "$asset_driver_choice" == "1" ]; then
	echo "Setting ASSET_STORAGE_DRIVER env variable to file"
	echo "ASSET_STORAGE_DRIVER=file" >> .env.local

	yq e '.services.app.volumes += ["../fuel/app/media/:/var/www/html/fuel/app/media/:rw"]' docker-compose.override.yml > temp.yml && mv temp.yml docker-compose.override.yml

elif [ "$asset_driver_choice" == "2" ]; then
	echo "Setting ASSET_STORAGE_DRIVER env variable to db"
	echo "ASSET_STORAGE_DRIVER=db" >> .env.local

else
	echo "Invalid choice."
	exit 1
fi

# default widget installation - skip if manually configuring db, since a db will not be accessible.
if [ "$db_choice" == "1" ]; then

	# Run migrations and seed any db data needed for a new install
	docker compose run --rm app /wait-for-it.sh mysql:3306 --timeout=120 --strict -- composer oil-install-quiet

	echo ""
	echo "Install default set of widgets?"
	echo "Unless you're working with an existing Materia installation, you will need to do this"
	echo "1. Install default widgets"
	echo "2. Skip"

	read -p "Enter an option (1 or 2): " install_widgets

	if [ "$install_widgets" == "1" ]; then
		echo "Installing default widgets"
		# Install the preconfigured default widgets
		docker compose run --rm app bash -c 'php oil r widget:install_from_config'
	elif [ "$install_widgets" == "2" ]; then
		echo "Skipping widgets installation"
	else
		echo "Invalid choice."
		exit 1
	fi

	# create a dev user based on your current shell user
	source run_create_me.sh
else
	echo "Skipping widget installation: note that this requires a functional DB configuration. If needed, the widget install process can be performed after the db is configured."
fi

echo ""
echo -e "Materia will be hosted on \033[32m$docker_ip\033[0m"
echo -e "A default superuser was created using your shell user \033[32m$USER\033[0m with password \033[32mkogneato\033[0m"
echo "Next steps:"

if [ "$db_choice" == "2" ]; then
	echo "Since you are connecting to an external db, edit the docker/.env.local file with the following:"
	echo -e "\033[32mMYSQL_ROOT_PASSWORD\033[0m, \033[32mMYSQL_USER\033[0m, \033[32mMYSQL_PASSWORD\033[0m, \033[32mMYSQL_DATABASE\033[0m"
	echo "These changes must be made prior to initializing."
	echo "Note that certain setup tasks like default widget installation have been deferred. Check docker/README.md for more."
fi

echo -e '\033[1mInitialize Materia:\033[0m docker compose up'
echo ""
echo "Note: this process initializes Materia with a self-signed cert. You will receive a browser warning"
echo "when you visit $docker_ip. You must add certificate exceptions for $docker_ip port 443.".
echo "A production instance will require a valid certificate and additional webserver configurations."
echo "Consult docker/README.md or our docs site at https://ucfopen.github.io/Materia-Docs/ for more info."