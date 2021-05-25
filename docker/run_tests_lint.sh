#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Script to run the linter in docker
#######################################################

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.override.test.yml"

set -e
set -o xtrace

$DCTEST run --rm --no-deps app composer sniff-ci
