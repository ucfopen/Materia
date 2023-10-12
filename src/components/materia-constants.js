export const creator = {
	INTERVAL: 30000
}

export const player = {
	LOG_INTERVAL: 10000, // How often to send logs to the server
	RETRY_LIMIT: 15, // When the logs fail to send, retry how many times before switching to slow mode?
	RETRY_FAST: 1000,
	RETRY_SLOW: 10000,
	EMBED_TARGET: 'container',
}

export const objectTypes = {
	QUESTION: 1,
	ASSET: 2,
	WIDGET: 3,
	WIDGET_INSTANCE: 4,
}

export const access = {
	VISIBLE: 1,
	PLAY: 5,
	SCORE: 10,
	DATA: 15,
	EDIT: 20,
	COPY: 25,
	FULL: 30,
	SHARE: 35,
	SU: 90,
}

export const WIDGET_URL = window.location.origin + '/widget/'
