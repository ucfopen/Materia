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

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.override.test.yml"

echo "remember you can limit your test groups with './run_tests_coverage.sh --group=Lti'"
echo "If you have an issue with a broken widget, clear the widgets with:"
echo "$DCTEST run --rm app bash -c -e 'rm /var/www/html/fuel/packages/materia/vendor/widget/test/*'"

# store the docker compose command to shorten the following commands
$DCTEST run --rm app /wait-for-it.sh mysql:3306 -t 20 -- composer run coverageci -- "$@"
