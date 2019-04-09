#!/bin/bash
set -e

NODE_DC_COMMAND="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"
DOCKER_IP="localhost"

# install composer deps
docker-compose run -e "COMPOSER_ALLOW_SUPERUSER=1" --rm --no-deps phpfpm composer install --no-progress --optimize-autoloader --no-scripts --no-suggest --no-dev

# install production node libs
$NODE_DC_COMMAND run --rm --no-deps node yarn install --frozen-lockfile --non-interactive --production

# declare files that should have been created
declare -a FILES_THAT_SHOULD_EXIST=(
	"public/js/materia.enginecore.js"
	"public/css/widget.css"
)

# nloop through all the files we expect to exist
for i in "${FILES_THAT_SHOULD_EXIST[@]}"
do
	if [ ! -f "../$i" ]; then
		echo "A file that should exist seems to be missing: $i"
		exit 1
	fi
done

# Accumulate licenses from composer
docker-compose run -e "COMPOSER_ALLOW_SUPERUSER=1" --rm --no-deps phpfpm ash -c "composer licenses --no-dev > licenses/LICENSES_COMPOSER"

# accumulate node licenses
$NODE_DC_COMMAND run --rm --no-deps node bash -c "yarn licenses list --no-color > licenses/LICENSES_NPM"

# lets, eh, zip it up?
if [ -f "../materia-pkg.zip" ]; then
	rm ../materia-pkg.zip
fi

# lets, eh, zip it up?
if [ -f "../materia-build-info.yml" ]; then
	rm ../materia-build-info.yml
fi

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
)

## now loop through excludes to build args for zip
EXCLUDE=''
for i in "${FILES_TO_EXCLUDE[@]}"
do
	EXCLUDE="$EXCLUDE --exclude=\"../$i\""
done

bash -c "zip -r $EXCLUDE ../materia-pkg.zip ../"

# now calulate hashes and gather build info
GITUSER=$(git config user.name)
GITEMAIL=$(git config user.email)
GITCOMMIT=$(git rev-parse HEAD)
GITREMOTE=$(git remote get-url origin)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# we'll use the php box to keep things working on all systems
MD5=$(docker-compose run --rm --no-deps phpfpm php -r "echo hash_file('md5', 'materia-pkg.zip');")
SHA1=$(docker-compose run --rm --no-deps phpfpm php -r "echo hash_file('sha1', 'materia-pkg.zip');")
SHA256=$(docker-compose run --rm --no-deps phpfpm php -r "echo hash_file('sha256', 'materia-pkg.zip');")

echo "build_date: $DATE" > ../materia-pkg-build-info.yml
echo "git: $GITREMOTE" >> ../materia-pkg-build-info.yml
echo "git_version: $GITCOMMIT" >> ../materia-pkg-build-info.yml
echo "git_user: $GITUSER" >> ../materia-pkg-build-info.yml
echo "git_user_email: $GITEMAIL" >> ../materia-pkg-build-info.yml
echo "sha1: $SHA1" >> ../materia-pkg-build-info.yml
echo "sha256: $SHA256" >> ../materia-pkg-build-info.yml
echo "md5: $MD5" >> ../materia-pkg-build-info.yml
