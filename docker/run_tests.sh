#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Script to run the unit tests without coverage
#######################################################

echo "remember you can limit your test groups with './run_tests.sh --group=Lti'"

# If you have an issue with a broken widget package breaking this script, run the following to clear the widgets
# docker-compose -f docker-compose.yml -f docker-compose.admin.yml run --rm app bash -c -e 'rm /var/www/html/fuel/packages/materia/vendor/widget/test/*'

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.override.test.yml"

set -e
set -o xtrace

$DCTEST run --rm app /wait-for-it.sh mysql:3306 -t 20 -- composer run testci -- "$@"
