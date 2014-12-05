MyWidgets = angular.module 'MyWidgets'
MyWidgets.service 'selectedWidgetSrv', ($rootScope, $q) ->

	STORAGE_TABLE_MAX_ROWS_SHOWN = 100

	selectedData = null
	storageData = null
	instId = null

	# Refactored variables
	_widget = null
	_dateRanges = null
	_BEARD_MODE = false
	_noWidgetsFlag = false

	# get and set _widget
	set = (widget) ->
		_widget = widget
		$rootScope.$broadcast 'selectedWidget.update'
		console.log _widget

	get = ->
		_widget

	getSelectedId = ->
		instId

	setSelectedId = (id) ->
		instId = id

	noWidgets = ->
		_noWidgetsFlag

	setNoWidgets = (bool) ->
		_noWidgetsFlag = bool
		$rootScope.$broadcast 'selectedWidget.noWidgets'

		if bool is true
			# This is temporary, we should look for an alternative to qtip
			# Or just a cleaner, more angular-y implementation in general
			$('header nav ul li:first-child').qtip
				content: 'Click here to start making a new widget!'
				position:
					corner:
						target: 'bottomMiddle'
						tooltip: 'topMiddle'
					adjust:
						y: 15
				style:
					background: '#b944cc'
					color: '#ffffff'
					padding: 10
					border:
						width: 2
						radius: 5
						color: '#b944cc'
					tip:
						corner: 'topMiddle'
						size:
							width: 15
							height: 10
				show:
					ready: true

	getScoreSummaries = ->
		deferred = $q.defer()
		Materia.Coms.Json.send 'score_summary_get', [_widget.id, true], (data) ->
			console.log data

			scoreData =
				list: []
				map: {}
				last: undefined

			if data isnt null and data.length > 0
				o = {}
				last = data[0].id
				for d in data
					o[d.id] = d

				# deferred.resolve {list:data, map:0, last:data[0]}
				scoreData =
					list: data
					map: o
					last: data[0]

			console.log scoreData

			deferred.resolve scoreData
		deferred.promise

	getUserPermissions = ->
		deferred = $q.defer()
		Materia.Coms.Json.send 'permissions_get', [0, _widget.id], (perms) ->
			permsObject =
				user : perms.user_perms
				widget: perms.widget_user_perms

			deferred.resolve permsObject

		deferred.promise

	getPlayLogsForSemester = (term, year) ->
		deferred = $q.defer()

		Materia.Coms.Json.send 'play_logs_get', [_widget.id, term, year], (logs) ->

			semesterKey = "#{year}#{term.toLowerCase()}"

			logsForSemester = []

			angular.forEach logs, (log, key) ->

				timestamp = log.time
				logMeta = getSemesterFromTimestamp(timestamp)
				semesterString = logMeta.year + logMeta.semester.toLowerCase()

				if semesterString == semesterKey
					logsForSemester.push log

			deferred.resolve logsForSemester
		deferred.promise

	# processDataIntoSemesters = (logs, getTimestampFunction) ->
	# 	semesters = {}
	# 	timestamp = null

	# 	$.each logs, (i, log) ->
	# 		timestamp = getTimestampFunction(log)
	# 		logMeta = getSemesterFromTimestamp(timestamp)
	# 		semesterString = logMeta.year + ' ' + logMeta.semester.toLowerCase()

	# 		if(!semesters[semesterString])
	# 			semesters[semesterString] = []
	# 		semesters[semesterString].push(log)
	# 	return semesters

	getDateRanges = ->
		deferred = $q.defer()
		unless _dateRanges?
			Materia.Coms.Json.send 'semester_date_ranges_get', [], (data) ->
				_dateRanges = data
				deferred.resolve data
		else
			deferred.resolve _dateRanges
		deferred.promise

	getCurrentSemester = ->
		return selectedData.year + ' ' + selectedData.term

	getSemesterFromTimestamp = (timestamp) ->
		for range in _dateRanges
			return range if timestamp >= parseInt(range.start, 10) && timestamp <= parseInt(range.end, 10)
		return undefined

	getStorageData = (inst_id, callback) ->
		if typeof storageData[inst_id] == 'undefined'
			Materia.Coms.Json.send 'play_storage_get', [inst_id], (data) ->
				storageData[inst_id] = {}
				temp = {}
				getPlayTime = (o) -> return o.play.time
				#table
				#semester

				for tableName, tableData of data
					temp[tableName] = processDataIntoSemesters(tableData, getPlayTime)
				for tableName, semestersData of temp
					for semesterId, semesterData of semestersData
						if typeof storageData[inst_id][semesterId] == 'undefined'
							storageData[inst_id][semesterId] = {}
						if semesterData.length > STORAGE_TABLE_MAX_ROWS_SHOWN
							storageData[inst_id][semesterId][tableName] = {truncated:true, total:semesterData.length, data:semesterData.slice(0, STORAGE_TABLE_MAX_ROWS_SHOWN)}
						else
							storageData[inst_id][semesterId][tableName] = {truncated:false, data:semesterData}

						storageData[inst_id][semesterId][tableName].data = normalizeStorageDataColumns(storageData[inst_id][semesterId][tableName].data)

				callback(storageData[inst_id])
		else
			callback(storageData[inst_id])

	set : set
	get : get
	getSelectedId: getSelectedId
	setSelectedId: setSelectedId
	noWidgets: noWidgets
	setNoWidgets: setNoWidgets
	getScoreSummaries: getScoreSummaries
	getUserPermissions: getUserPermissions
	getPlayLogsForSemester: getPlayLogsForSemester
	getDateRanges: getDateRanges
	getCurrentSemester: getCurrentSemester
	getSemesterFromTimestamp: getSemesterFromTimestamp
	getStorageData: getStorageData