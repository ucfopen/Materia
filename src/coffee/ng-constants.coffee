app = angular.module 'materia'

app.constant 'PLAYER',
	LOG_INTERVAL: 10000 # How often to send logs to the server
	RETRY_LIMIT: 50 # When the logs fail to send, retry how many times before quiting?\
	EMBED_TARGET: 'container' # id of the container to put the flash in

