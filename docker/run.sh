#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Run ad hoc commands on the phpfpm container (non-test env)
#
# Arguments are executed string
# EX: ./run.sh echo "hello"
# EX: ./run.sh composer update
# EX: ./run.sh composer test --group=Lti
# EX; DC='docker-compose -f docker-compose.yml -f docker-compose.alpine.yml' ./run.sh commposer update
#######################################################

set -e

# use env/args to determine which docker-compose files to load
source run_dc.sh

docker-compose run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env COMPOSER_ALLOW_SUPERUSER=1 "$@"
