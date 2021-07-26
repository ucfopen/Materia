#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# INSTALLS WIDGETS FROM EXISTING WIGT FILE
#
# place .wigt files in app/fuel/app/tmp/widget_packages/
# Supports globs, but you have to quote them so they aren't
# expanded in your host's shell instead of the container's
#
# EX: ./install_widget.sh adventure.wigt
# EX: ./install_widget.sh '*.wigt'
#######################################################
set -e

docker-compose run --rm app bash -c 'php oil r widget:install fuel/app/tmp/widget_packages/'$1
