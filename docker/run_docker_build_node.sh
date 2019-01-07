#!/bin/bash
#######################################################
# ABOUT THIS SCRIPT
#
# Builds a new materia-node container using a dockerfile
# Usefull for updating that container and uploading it
# to our AWS Docker Container Repository
#
# EX: ./run_docker_build_node.sh
#######################################################
set -e

BOX_NAME="materia-node"
DOCKERFILE="materia-node"
DCR="ucfopen"

cd ./dockerfiles
docker build -t $BOX_NAME:latest -f $DOCKERFILE .

echo "==================================================="
echo "To tag the latest build as a specific version, use:"
echo "> docker tag $BOX_NAME:latest $DCR/$BOX_NAME:latest"
echo "or"
echo "> docker tag $BOX_NAME:latest $DCR/$BOX_NAME:X.X.X"
echo "To publish the 'latest' container:"
echo "> docker push $DCR/$BOX_NAME:latest"
echo "or"
echo "> docker push $DCR/$BOX_NAME:X.X.X"
