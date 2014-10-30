MyWidgets = angular.module 'MyWidgets'
MyWidgets.service 'selectedWidgetSrv', ($rootScope) ->

	STORAGE_TABLE_MAX_ROWS_SHOWN = 100

	selectedData = null
	storageData = null
	instId = null
	dateRanges = null

	# Refactored variables
	_widget = null
	_BEARD_MODE = false

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

	getCurrentSemester = ->
		return selectedData.year + ' ' + selectedData.term

	getSemesterFromTimestamp = (timestamp) ->
		for range in dateRanges
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
	getCurrentSemester: getCurrentSemester
	getSemesterFromTimestamp: getSemesterFromTimestamp
	getStorageData: getStorageData