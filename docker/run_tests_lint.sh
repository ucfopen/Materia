#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Script to run the linter in docker
#######################################################
set -e
set -o xtrace

DCTEST="docker-compose -f docker-compose.yml -f docker-compose.override.test.yml"

$DCTEST run --rm --no-deps app composer sniff-ci
