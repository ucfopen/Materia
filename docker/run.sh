#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Run ad hoc commands on the app container (non-test env)
#
# Arguments are executed string
# EX: ./run.sh echo "hello"
# EX: ./run.sh composer update
# EX: ./run.sh composer test --group=Lti
# EX; DC='docker-compose -f docker-compose.yml -f docker-compose.alpine.yml' ./run.sh commposer update
#######################################################

set -e

docker-compose run --rm app /wait-for-it.sh mysql:3306 -t 20 -- "$@"
