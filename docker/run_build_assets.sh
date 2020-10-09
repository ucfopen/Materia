#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Builds assets using the included node container
#######################################################
set -e

# use env/args to determine which docker-compose files to load
source run_dc.sh

$DC run --rm phpfpm yarn install --silent --pure-lockfile --force
