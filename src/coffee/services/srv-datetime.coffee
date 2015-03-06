app = angular.module 'materia'
app.service 'dateTimeServ', ->

	parseObjectToDateString = (time) ->
		timeObj = new Date(time*1000)
		year = String(timeObj.getFullYear())
		(timeObj.getMonth()+1) + '/' + timeObj.getDate() + '/' + year.substr(2)

	parseTime = (time) ->
		timeObj = new Date(time*1000)
		amPm = 'am'
		hour = timeObj.getHours()
		minute = timeObj.getMinutes()

		if minute < 10 then minute = '0' + minute

		if hour > 11
			if hour != 12 then hour -= 12
			amPm = 'pm'
		else
			if hour == 0 then hour = '12'

		hour + ':' + minute + amPm

	fixTime = (time, servTime) ->
		timeToFix = new Date(time).getTime()
		serverDateFromPage = servTime

		# calculate client/server time difference
		now = new Date()
		clientUTCDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
		serverUTCDate = new Date(serverDateFromPage)
		clientUTCTimestamp = clientUTCDate.getTime()
		serverUTCTimestamp = serverUTCDate.getTime()
		offset = serverUTCTimestamp - clientUTCTimestamp

		newDate = new Date(timeToFix + offset)
		fullHour = newDate.getHours()
		shortHour = if fullHour%12 is 0 then 12 else fullHour%12
		fixedDateStr = shortHour + ':' + String('00' + newDate.getMinutes()).slice(-2)

		if fullHour > 11 then fixedDateStr += 'pm'
		else fixedDateStr += 'am'

		fixedDateStr

	parseObjectToDateString : parseObjectToDateString,
	parseTime : parseTime,
	fixTime : fixTime
