Namespace('Materia.Coms').Json = (() => {
	let _gatewayURL = null
	let _$q

	// need to use the annotated angular method because webpack doesn't protect it for us
	angular.injector(['ng']).invoke([
		'$q',
		function ($q) {
			_$q = $q
		},
	])

	const _showError = (data) => {
		if (data.title === 'Invalid Login') {
			// redirect to login page
			window.location = BASE_URL + 'login'
		}
	}

	// prepare the callback interrupt
	const _resposeErrorChecker = (data, ignoreError) => {
		// show errors if they exist
		if (
			ignoreError != null &&
			data != null &&
			data.msg != null &&
			data.title != null &&
			data.type != null
		) {
			_showError(data)
		}
	}

	const _sendRequest = (method, url, body) => {
		let deferred = _$q.defer()
		const options = {
			method,
			body,
			credentials: 'same-origin',
			cache: 'no-cache',
			headers: {
				accept: 'application/json;',
				'content-type': 'application/json; charset=utf-8',
			},
		}

		fetch(url, options)
			.then((res) => res.json())
			.then((json) => {
				_resposeErrorChecker(json, false)
				deferred.resolve(json)
			})
			.catch((error) => {
				deferred.reject()
				_showError('Error Sending request to ' + url)
			})

		return deferred.promise
	}

	const setGateway = (newGateway) => {
		_gatewayURL = newGateway
	}

	// older api
	const send = (method, args) => {
		let deferred = _$q.defer()

		if (_gatewayURL == null) {
			_gatewayURL = API_LINK
		}
		if (args == null) {
			args = []
		}

		let options = {
			method: 'POST',
			credentials: 'same-origin',
			cache: 'no-cache',
			body: `data=${encodeURIComponent(JSON.stringify(args))}`,
			headers: {
				accept: 'application/json, text/javascript, */*; q=0.01',
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
		}
		// returns deferred
		fetch(_gatewayURL + method + '/', options)
			.then((res) => res.text())
			.then((body) => {
				if (body) body = JSON.parse(body)
				_resposeErrorChecker(body, false)
				deferred.resolve(body)
			})
			.catch((error) => {
				deferred.reject(error)
			})

		return deferred.promise
	}

	// newer XMLHttpRequest json api
	const get = (url) => {
		return _sendRequest('GET', url)
	}

	// newer XMLHttpRequest json api
	const post = function (url, dataObject) {
		if (dataObject == null) {
			dataObject = {}
		}
		return _sendRequest('POST', url, JSON.stringify(dataObject))
	}

	// return true if jsonResult is an error object
	const isError = (jsonResult) => jsonResult != null && typeof jsonResult.errorID !== 'undefined'

	// public methods
	return {
		send,
		isError,
		post,
		get,
		setGateway,
	}
})()
