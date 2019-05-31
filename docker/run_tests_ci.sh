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

# clean environment and configs
source run_clean.sh

# install php deps
$DC run --rm phpfpm composer install --no-progress

# run linter
$DC run --rm phpfpm env COMPOSER_ALLOW_SUPERUSER=1 composer sniff-ci

# install widgets and run tests
source run_tests_coverage.sh

# turn off failure stop on error
set +e

# stop and remove docker containers
$DC stop
$DC rm -f
