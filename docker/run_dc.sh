#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Determines which docker-compose files to use
#######################################################

# store the docker compose command to shorten the following commands
if [[ -z "${COMPOSE_WITH}" ]]
then
    DC_PLATFORM=''
else
    DC_PLATFORM="-f docker-compose.${COMPOSE_WITH}.yml"
fi

DC="docker-compose -f docker-compose.yml ${DC_PLATFORM}"
