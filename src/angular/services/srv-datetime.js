const app = angular.module('materia')
app.service('DateTimeServ', function () {
	const parseObjectToDateString = (time) => {
		const timeObj = new Date(time * 1000)
		const year = String(timeObj.getFullYear())
		return timeObj.getMonth() + 1 + '/' + timeObj.getDate() + '/' + year.substr(2)
	}

	const parseTime = (time) => {
		const timeObj = new Date(time * 1000)
		let amPm = 'am'
		let hour = timeObj.getHours()
		let minute = timeObj.getMinutes()

		if (minute < 10) {
			minute = `0${minute}`
		}

		if (hour > 11) {
			if (hour !== 12) {
				hour -= 12
			}
			amPm = 'pm'
		} else {
			if (hour === 0) {
				hour = '12'
			}
		}

		return `${hour}:${minute}${amPm}`
	}

	// manipulates time by the current user's timezone offset from the server
	// @TODO: this seems all wrong.  Server times should be UTC and all we have to do
	// is convert that to local and back to UTC when sending
	const fixTime = (time, serverUTCDateFromPage) => {
		let timeToFix = new Date(time).getTime()

		// calculate client/server time difference
		let now = new Date()
		let clientUTCDate = new Date(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
			now.getUTCHours(),
			now.getUTCMinutes(),
			now.getUTCSeconds()
		)
		let serverUTCDate = new Date(serverUTCDateFromPage)
		let clientUTCTimestamp = clientUTCDate.getTime()
		let serverUTCTimestamp = serverUTCDate.getTime()
		let offset = serverUTCTimestamp - clientUTCTimestamp
		let newDate = new Date(timeToFix + offset)
		let fullHour = newDate.getHours()
		let shortHour = fullHour % 12 === 0 ? 12 : fullHour % 12
		let fixedDateStr = shortHour + ':' + String(`00${newDate.getMinutes()}`).slice(-2)

		if (fullHour > 11) {
			fixedDateStr += 'pm'
		} else {
			fixedDateStr += 'am'
		}

		return fixedDateStr
	}

	return {
		parseObjectToDateString,
		parseTime,
		fixTime,
	}
})
