#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Install and build a base release package
# This should try to include as many constructed
# assets as possible to reduce the work needed
# to deploy Materia. This build will not
# disrupt the current files on disk -
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

# combine the files to exclude
EXCLUDE=''
for i in "${FILES_TO_EXCLUDE[@]}"
do
	EXCLUDE="$EXCLUDE --exclude=\"./$i\""
done

# use env/args to determine which docker-compose files to load
source run_dc.sh

# store the docker compose command to shorten the following commands
DCTEST="$DC -f docker-compose.test.yml"

set -o xtrace

# # stop and remove docker containers
$DCTEST down --volumes --remove-orphans

$DCTEST pull --ignore-pull-failures phpfpm

# get rid of any left over package files
rm -rf clean_build_clone || true
rm -rf ../materia-pkg* || true
git clone ../ ./clean_build_clone

# gather build info
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GITUSER=$(git config user.name)
GITEMAIL=$(git config user.email)
GITCOMMIT=$(cd clean_build_clone && git rev-parse HEAD)
GITREMOTE=$(git remote get-url origin)

# remove .git dir for slightly faster copy
rm -rf clean_build_clone/.git

# start a build container
$DCTEST run --no-deps -d --workdir /build/clean_build_clone --name materia-build phpfpm tail -f /dev/null

# copy the clean build clone into the container
docker cp ./clean_build_clone materia-build:/build

# clean up
rm -rf clean_build_clone || true

# install production node_modules
docker exec materia-build yarn install --frozen-lockfile --non-interactive --production

# verify all files we expect to be created exist
for i in "${FILES_THAT_SHOULD_EXIST[@]}"
do
	docker exec materia-build stat /build/clean_build_clone/$i
done

# zip, excluding some files
docker exec materia-build  bash -c "zip -r $EXCLUDE ../materia-pkg.zip ./"

# calulate hashes
MD5=$(docker exec materia-build md5sum ../materia-pkg.zip | awk '{ print $1 }')
SHA1=$(docker exec materia-build sha1sum ../materia-pkg.zip | awk '{ print $1 }')
SHA256=$(docker exec materia-build sha256sum ../materia-pkg.zip | awk '{ print $1 }')

# copy zip file from container to host
docker cp materia-build:/build/materia-pkg.zip ../materia-pkg.zip

# write build info file
echo "build_date: $DATE" > ../materia-pkg-build-info.yml
echo "git: $GITREMOTE" >> ../materia-pkg-build-info.yml
echo "git_version: $GITCOMMIT" >> ../materia-pkg-build-info.yml
echo "git_user: $GITUSER" >> ../materia-pkg-build-info.yml
echo "git_user_email: $GITEMAIL" >> ../materia-pkg-build-info.yml
echo "sha1: $SHA1" >> ../materia-pkg-build-info.yml
echo "sha256: $SHA256" >> ../materia-pkg-build-info.yml
echo "md5: $MD5" >> ../materia-pkg-build-info.yml

# clean environment and configs
$DCTEST down --volumes --remove-orphans
