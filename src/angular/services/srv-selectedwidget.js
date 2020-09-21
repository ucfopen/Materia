const app = angular.module('materia')
app.service('SelectedWidgetSrv', function ($rootScope, $q, OBJECT_TYPES) {
	const STORAGE_TABLE_MAX_ROWS_SHOWN = 100

	const selectedData = null
	const storageData = null
	const instId = null

	// Refactored variables
	let _widget = null
	let _dateRanges = null
	let _scoreData = null
	let _storageData = null

	// get and set _widget
	const set = (widget) => {
		_scoreData = null
		_storageData = null
		_widget = widget
		$rootScope.$broadcast('selectedWidget.update')
	}

	const get = () => _widget

	const getSelectedId = () => _widget.id

	const getScoreSummaries = () => {
		const deferred = $q.defer()

		if (_scoreData) {
			deferred.resolve(_scoreData)
		} else {
			let loadingId = _widget.id
			Materia.Coms.Json.send('score_summary_get', [loadingId, true]).then((data) => {
				if (loadingId !== _widget.id) {
					return deferred.reject()
				}

				_scoreData = {
					list: [],
					map: {},
					last: undefined,
				}

				if (data !== null && data.length > 0) {
					const map = {}
					data.forEach((d) => {
						map[d.id] = d
					})

					_scoreData = {
						list: data,
						map,
						last: data[0],
					}
				}

				deferred.resolve(_scoreData)
			})
		}

		return deferred.promise
	}

	const getUserPermissions = () => {
		return Materia.Coms.Json.send('permissions_get', [
			OBJECT_TYPES.WIDGET_INSTANCE,
			_widget.id,
		]).then((perms) => {
			const permsObject = {
				user: perms.user_perms,
				widget: perms.widget_user_perms,
			}

			return permsObject
		})
	}

	const getPlayLogsForSemester = (term, year) => {
		const deferred = $q.defer()

		Materia.Coms.Json.send('play_logs_get', [_widget.id, term, year]).then((logs) => {
			const semesterKey = `${year}${term.toLowerCase()}`
			const logsForSemester = []
			angular.forEach(logs, (log, key) => {
				const timestamp = log.time
				const logMeta = getSemesterFromTimestamp(timestamp)
				const semesterString = logMeta.year + logMeta.semester.toLowerCase()

				if (semesterString === semesterKey) {
					logsForSemester.push(log)
				}
			})

			deferred.resolve(logsForSemester)
		})

		return deferred.promise
	}

	const getDateRanges = () => {
		const deferred = $q.defer()
		if (_dateRanges == null) {
			Materia.Coms.Json.send('semester_date_ranges_get', []).then((data) => {
				_dateRanges = data
				deferred.resolve(data)
			})
		} else {
			deferred.resolve(_dateRanges)
		}
		return deferred.promise
	}

	const getSemesterFromTimestamp = (timestamp) => {
		return _dateRanges.find(
			(r) => timestamp >= parseInt(r.start, 10) && timestamp <= parseInt(r.end, 10)
		)
	}

	const getStorageData = (loadIfNotCached = true) => {
		const deferred = $q.defer()

		if (_storageData != null) {
			deferred.resolve(_storageData)
		} else if (loadIfNotCached) {
			Materia.Coms.Json.send('play_storage_get', [_widget.id]).then((data) => {
				_storageData = {}

				const temp = {}

				// process semester data and organize by table name
				angular.forEach(
					data,
					(tableData, tableName) => (temp[tableName] = _processDataIntoSemesters(tableData))
				)

				// have to loop through each table present in the storage data
				angular.forEach(temp, (semesters, tableName) =>
					// have to loop through each semester contained within each table
					angular.forEach(semesters, (semesterData, semesterId) => {
						if (typeof _storageData[semesterId] === 'undefined') {
							_storageData[semesterId] = {}
						}

						if (semesterData.length > STORAGE_TABLE_MAX_ROWS_SHOWN) {
							_storageData[semesterId][tableName] = {
								truncated: true,
								total: semesterData.length,
								data: semesterData.slice(0, STORAGE_TABLE_MAX_ROWS_SHOWN),
							}
						} else {
							_storageData[semesterId][tableName] = { truncated: false, data: semesterData }
						}

						_storageData[semesterId][tableName].data = _normalizeStorageDataColumns(
							_storageData[semesterId][tableName].data
						)
					})
				)
				deferred.resolve(_storageData)
			})
		} else {
			deferred.resolve()
		}

		return deferred.promise
	}

	const _processDataIntoSemesters = (logs) => {
		const semesters = {}
		let timestamp = null

		angular.forEach(logs, (log, index) => {
			timestamp = log.play.time
			const logMeta = getSemesterFromTimestamp(timestamp)
			const semesterString = logMeta.year + ' ' + logMeta.semester.toLowerCase()

			if (!semesters[semesterString]) {
				semesters[semesterString] = []
			}
			semesters[semesterString].push(log)
		})

		return semesters
	}

	//  storage data doesn't really enforce a schema.
	//  this function determines every field used throughout the
	//  storage data and then applies that schema to each item.
	const _normalizeStorageDataColumns = (rows) => {
		//  go through all the rows and collect the fields used:
		const fields = {}
		for (var r of rows) {
			for (let j in r.data) {
				if (typeof r.data[j] === 'undefined') {
					r.j = null
				}
			}
		}

		//  now go through each row again and add in the missing fields
		for (r of rows) {
			r.data = Object.assign({}, fields, r.data)
		}

		return rows
	}

	const getMaxRows = () => STORAGE_TABLE_MAX_ROWS_SHOWN

	const notifyAccessDenied = () => {
		$rootScope.$broadcast('selectedWidget.notifyAccessDenied')
	}

	return {
		set,
		get,
		getSelectedId,
		getScoreSummaries,
		getUserPermissions,
		getPlayLogsForSemester,
		getDateRanges,
		getSemesterFromTimestamp,
		getStorageData,
		getMaxRows,
		notifyAccessDenied,
	}
})
