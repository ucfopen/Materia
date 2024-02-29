FULLPATH=${PWD##*/}
CONTAINER="${FULLPATH}_python_1"
docker exec -it $CONTAINER "$@"