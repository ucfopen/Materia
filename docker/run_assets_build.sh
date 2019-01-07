#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Builds assets using the included node container
#######################################################
set -e

NODE_DC_COMMAND="docker-compose -f docker-compose.yml -f docker-compose.admin.yml"

$NODE_DC_COMMAND run --rm node yarn install --silent --pure-lockfile --force
