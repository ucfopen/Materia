#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Builds assets using the included node container
#######################################################
set -e

# build the js/css assets into the public directory using node in a docker container

# create a volume for 2 reaons:
# 1. cache node_modules
# 2. don't interact with the host's node_modules files
docker volume create materia-asset-build-vol

# bind the root of materia into /build, install git, and run yarn
# yarn install will install all deps & execute build
# which will populate files in the host's public directory
docker run \
    --rm \
	--name materia-asset-build \
	--mount type=bind,source="$(pwd)"/../,target=/build \
	--mount source=materia-asset-build-vol,target=/build/node_modules \
	node:12.11.1-alpine \
	/bin/ash -c "apk add --no-cache git && cd build && yarn install --frozen-lockfile --non-interactive --production --silent --pure-lockfile --force"
