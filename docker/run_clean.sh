#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Prepares a clean environment
#
# EX: ./run_docker_build_node.sh
#######################################################

# clean migration files in every environment
rm -f $DIR/app/fuel/app/config/**/migrations.php

# store the docker compose command to shorten the following commands
DC="docker-compose -f docker-compose.yml -f docker-compose.admin.yml -f docker-compose.build.yml"

# stop and remove docker containers
$DC down

$DC build --pull
