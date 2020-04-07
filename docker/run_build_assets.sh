#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Builds assets using the included node container
#######################################################
set -e

NODE_DC_COMMAND="docker-compose"

$NODE_DC_COMMAND run --rm phpfpm yarn install --silent --pure-lockfile --force
