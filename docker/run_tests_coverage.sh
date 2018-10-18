#!/bin/bash
set -e

echo "remember you can limit your test groups with './run_tests_coverage.sh --group=Lti'"

# If you have an issue with a broken widget package breaking this script, run the following to clear the widgets
# docker-compose -f docker-compose.yml -f docker-compose.admin.yml run --rm phpfpm bash -c -e 'rm /var/www/html/fuel/packages/materia/vendor/widget/test/*'

# store the docker compose command to shorten the following commands
DC="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"
$DC run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env COMPOSER_ALLOW_SUPERUSER=1 composer run coverageci -- "$@"
