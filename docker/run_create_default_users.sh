#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# create/update the default users.
# use this if you forget or lost the defaul
# user passwords
#
# EX: ./run_create_default_users.sh
#######################################################

# create/update the default users
docker-compose run --rm app bash -c "php oil r admin:create_default_users"
