FULLPATH=${PWD##*/}
CONTAINER="${FULLPATH}-python-1"
docker exec -it $CONTAINER "$@"
