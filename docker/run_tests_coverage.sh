#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# RUNS TESTS WITH COVERAGE
#
# place .wigt files in app/fuel/app/tmp/widget_packages/
# Supports globs, but you have to quote them so they aren't
# expanded in your host's shell instead of the container's
#
# EX: ./run_tests_coverage.sh
# EX: ./run_tests_coverage.sh --group=Lti
#######################################################
set -e

# use env/args to determine which docker-compose files to load
source run_dc.sh

DCTEST="$DC -f docker-compose.test.yml"

echo "remember you can limit your test groups with './run_tests_coverage.sh --group=Lti'"
echo "If you have an issue with a broken widget, clear the widgets with:"
echo "$DCTEST run --rm phpfpm bash -c -e 'rm /var/www/html/fuel/packages/materia/vendor/widget/test/*'"

# store the docker compose command to shorten the following commands
$DCTEST run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env COMPOSER_ALLOW_SUPERUSER=1 composer run coverageci -- "$@"
