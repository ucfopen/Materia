#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Create an admin user based on the
# current user of this machine
#
# EX: ./run_create_me.sh
#######################################################

# create an admin for the current host user
# customize your password by setting MATERIA_DEV_PASS
PASS=${MATERIA_DEV_PASS:-kogneato}

# create or update the user and pw
docker-compose run --rm app bash -c "php oil r admin:new_user $USER $USER M Lastname $USER@mail.com $PASS || php oil r admin:reset_password $USER $PASS"

# give them super_user and basic_author
docker-compose run --rm app bash -c "php oil r admin:give_user_role $USER super_user || true && php oil r admin:give_user_role $USER basic_author"
