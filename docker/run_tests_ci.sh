#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# CI script for reliably running clean tests with current boxes
#
# Continuously builds assets using the included node container
# Doesn't seem to stop properly with ctrl-c
# use "docker stop <box_name>" to kill it
#######################################################
set -e
set -o xtrace

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.test.yml"

$DCTEST pull --ignore-pull-failures phpfpm fakes3

# install php deps
$DCTEST run --rm --no-deps phpfpm composer install --no-progress

# run linter
$DCTEST run --rm --no-deps phpfpm env COMPOSER_ALLOW_SUPERUSER=1 composer sniff-ci

# install widgets and run tests
source run_tests_coverage.sh

# turn off failure stop on error
set +e

# stop and remove docker containers
$DCTEST rm --force --stop
