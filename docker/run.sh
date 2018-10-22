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
#######################################################

set -e

docker-compose run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env COMPOSER_ALLOW_SUPERUSER=1 "$@"
