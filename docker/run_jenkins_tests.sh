#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Jenkins script for reliably running clean tests with current boxes
#
# Continuously builds assets using the included node container
# Doesn't seem to stop properly with ctrl-c
# use "docker stop <box_name>" to kill it
#######################################################
set -e

# clean migration files
rm -f $DIR/app/fuel/app/config/development/migrations.php
rm -f $DIR/app/fuel/app/config/test/migrations.php

# store the docker compose command to shorten the following commands
DC="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"

# stop and remove docker containers
$DC stop
$DC rm -f --all

$DC pull
$DC build mysql
$DC build phpfpm

# install php deps
$DC run --rm phpfpm composer install --no-progress

# run linter
$DC run --rm phpfpm env COMPOSER_ALLOW_SUPERUSER=1 composer sniff-summary

# install widgets and run tests
source ./run_tests_coverage.sh

# turn off failure stop on error
set +e
# lets remove everything we just made
$DC run --rm phpfpm bash -c 'rm -rf ./fuel'
$DC run --rm phpfpm bash -c 'chmod -R 777 ./coverage'
$DC run --rm phpfpm bash -c 'chmod -R 777 ./coverage*'

# stop and remove docker containers
$DC stop
$DC rm -f --all
