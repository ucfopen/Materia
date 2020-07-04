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

# use env/args to determine which docker-compose files to load
source run_dc.sh

# create/update the default users
$DC run --rm phpfpm bash -c "php oil r admin:create_default_users"
