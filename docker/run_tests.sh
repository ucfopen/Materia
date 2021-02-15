#!/bin/bash
set -e

echo "remember you can limit your test groups with './run_tests.sh --group=Lti'"

# If you have an issue with a broken widget package breaking this script, run the following to clear the widgets
# docker-compose -f docker-compose.yml -f docker-compose.admin.yml run --rm phpfpm bash -c -e 'rm /var/www/html/fuel/packages/materia/vendor/widget/test/*'

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.test.yml"

$DCTEST run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env COMPOSER_ALLOW_SUPERUSER=1 composer run testci -- "$@"
