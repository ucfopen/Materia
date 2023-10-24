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

for n in {1..100};
do
    docker-compose run --rm app bash -c "php oil r admin:new_user $USER-$n $USER-$n M Lastname $USER-$n@mail.com $PASS || php oil r admin:reset_password $USER-$n $PASS"
    docker-compose run --rm app bash -c "php oil r admin:give_user_role $USER-$n super_user || true && php oil r admin:give_user_role $USER-$n basic_author"
done

for n in {1..20};
do
    docker-compose run --rm app bash -c "php oil r admin:new_user student-$n student-$n M Lastname student-$n@mail.com $PASS || php oil r admin:reset_password student-$n $PASS"
    docker-compose run --rm app bash -c "php oil r admin:give_user_role student-$n basic_author"
    break
done

# give them super_user and basic_author
docker-compose run --rm app bash -c "php oil r admin:give_user_role $USER super_user || true && php oil r admin:give_user_role $USER basic_author"
