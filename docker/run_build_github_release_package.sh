#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Install and build a base release package
# This should try to include as many constructed
# assets as possible to reduce the work needed
# to deploy Materia.
# ex: no need to install node # or npm packages
# to build js - just include the js
#
# EX: ./run_build_release_package.sh
#######################################################
set -e

# declare files that should have been created
declare -a FILES_THAT_SHOULD_EXIST=(
	"public/js/materia.enginecore.js"
	"public/css/widget-play.css"
)

# declare files to omit from zip
declare -a FILES_TO_EXCLUDE=(
	".git*"
	".gitignore"
	"app.json"
	"nginx_app.conf"
	"Procfile"
	"node_modules*"
	"githooks"
	"phpcs.xml"
	"src*"
	"fuel/app/config/development*"
	"fuel/app/config/heroku*"
	"fuel/app/config/test*"
	"fuel/app/config/production*"
	"public/widget*"
	"githooks*"
	"coverage.xml"
	"coverage*"
)

## now loop through excludes to build args for zip
EXCLUDE=''
for i in "${FILES_TO_EXCLUDE[@]}"
do
	EXCLUDE="$EXCLUDE --exclude=\"./$i\""
done

# store the docker compose command to shorten the following commands
DC="docker-compose -f docker-compose.yml -f docker-compose.admin.yml -f docker-compose.build.yml"
RUN_W_OPTS="run --rm --no-deps --workdir /build/cleancopy"

set -o xtrace

# clean environment and configs
source run_clean.sh

# get rid of any left over package files
rm -rf ../cleancopy || true
rm -rf ../materia-pkg* || true
git clone ../ ../cleancopy

# make sure we have a built containter to copy into the volume
$DC run --no-deps --detach --workdir /build/cleancopy --name materia-phpfpm-for-cp phpfpm tail -f /dev/null

# install a copy of this git repo
docker cp ../cleancopy materia-phpfpm-for-cp:/build
rm -rf ../cleancopy || true

# install a copy of composer
docker cp ./run_get_composer.sh materia-phpfpm-for-cp:/build/cleancopy/
docker exec materia-phpfpm-for-cp bash run_get_composer.sh
docker exec materia-phpfpm-for-cp rm run_get_composer.sh

# install composer deps
# docker exec materia-phpfpm-for-cp composer install --no-progress --optimize-autoloader --no-scripts --no-suggest --no-dev

# install production node libs
$DC $RUN_W_OPTS node yarn install --frozen-lockfile --non-interactive --production

# verify all files we expect to be created exist
for i in "${FILES_THAT_SHOULD_EXIST[@]}"
do
	docker exec materia-phpfpm-for-cp stat /build/cleancopy/$i
done

# Accumulate licenses from composer
# docker exec materia-phpfpm-for-cp ash -c "composer licenses --no-dev > licenses/LICENSES_COMPOSER"

# accumulate node licenses
# $DC $RUN_W_OPTS node bash -c "yarn licenses list --no-color > licenses/LICENSES_NPM"

# zip
$DC $RUN_W_OPTS node bash -c "zip -r $EXCLUDE ../materia-pkg.zip ./"

# copy zip file to host
docker cp materia-phpfpm-for-cp:/build/materia-pkg.zip ../materia-pkg.zip

# now calulate hashes and gather build info
GITUSER=$(git config user.name)
GITEMAIL=$(git config user.email)
GITCOMMIT=$(git rev-parse HEAD)
GITREMOTE=$(git remote get-url origin)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# we'll use the php box to keep things working on all systems
MD5=$(docker exec materia-phpfpm-for-cp php -r "echo hash_file('md5', '../materia-pkg.zip');")
SHA1=$(docker exec materia-phpfpm-for-cp php -r "echo hash_file('sha1', '../materia-pkg.zip');")
SHA256=$(docker exec materia-phpfpm-for-cp php -r "echo hash_file('sha256', '../materia-pkg.zip');")

echo "build_date: $DATE" > ../materia-pkg-build-info.yml
echo "git: $GITREMOTE" >> ../materia-pkg-build-info.yml
echo "git_version: $GITCOMMIT" >> ../materia-pkg-build-info.yml
echo "git_user: $GITUSER" >> ../materia-pkg-build-info.yml
echo "git_user_email: $GITEMAIL" >> ../materia-pkg-build-info.yml
echo "sha1: $SHA1" >> ../materia-pkg-build-info.yml
echo "sha256: $SHA256" >> ../materia-pkg-build-info.yml
echo "md5: $MD5" >> ../materia-pkg-build-info.yml

# clean environment and configs
#$DC down --volumes --remove-orphans --timeout 1
$DC down --volumes --remove-orphans
