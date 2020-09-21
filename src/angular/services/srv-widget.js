const app = angular.module('materia')
app.service('WidgetSrv', function (SelectedWidgetSrv, DateTimeServ, $q, $rootScope, $window) {
	const deferred = $q.defer()
	let _widgets = []
	let _widgetIds = {}
	let gotAll = false

	const sortWidgets = () => _widgets.sort((a, b) => b.created_at - a.created_at)

	const getWidgets = (force = false) => {
		const deferred = $q.defer()

		if (_widgets.length === 0 || !gotAll || force) {
			gotAll = true
			_getMultipleFromServer().then((widgets) => {
				_widgets = widgets.slice(0) // save a copy
				sortWidgets()
				deferred.resolve(_widgets)
			})
		} else {
			deferred.resolve(_widgets)
		}

		return deferred.promise
	}

	const getWidget = (id = null) => {
		const deferred = $q.defer()

		if (!id) {
			deferred.reject()
		} else if (_widgetIds[id] != null) {
			// return the requested widget if we have it
			deferred.resolve(_widgetIds[id])
		} else {
			// we dont have any widgets or the requested one, get it/them
			_getSingleWidgetFromServer(id)
				.then((widget) => {
					_widgets.push(widget)
					_widgetIds[widget.id] = widget
					sortWidgets()
					deferred.resolve(widget)
				})
				.catch(() => {
					return deferred.reject()
				})
		}

		return deferred.promise
	}

	const getWidgetInfo = (id = null) => {
		return Materia.Coms.Json.send('widgets_get', [[id]]).then((widgets) => widgets[0])
	}

	const lockWidget = (id = null) => {
		const deferred = $q.defer()
		Materia.Coms.Json.send('widget_instance_lock', [id]).then((success) => {
			if (success) {
				deferred.resolve(id)
			} else {
				deferred.reject(
					'Someone else is editing this widget, you will be able to edit after they finish.'
				)
			}
		})
		return deferred.promise
	}

	const getWidgetsByType = (type = 'featured') => {
		return Materia.Coms.Json.send('widgets_get_by_type', [type])
	}

	const copyWidget = (inst_id, newName, retainAccess = false) => {
		return Materia.Coms.Json.send('widget_instance_copy', [inst_id, newName, retainAccess])
	}

	const deleteWidget = (inst_id) => {
		return Materia.Coms.Json.send('widget_instance_delete', [inst_id])
	}

	const saveWidget = (_params) => {
		const deferred = $q.defer()
		const defaults = {
			qset: null,
			is_draft: null,
			open_at: null,
			close_at: null,
			attempts: null,
			guest_access: null,
			embedded_only: null,
		}

		let params = Object.assign({}, defaults, _params)

		if (params.inst_id != null) {
			// limit args to the the following params
			let args = [
				params.inst_id,
				params.name,
				params.qset,
				params.is_draft,
				params.open_at,
				params.close_at,
				params.attempts,
				params.guest_access,
				params.embedded_only,
			]
			Materia.Coms.Json.send('widget_instance_update', args).then((widget) => {
				if (widget != null) {
					_initSearchCache(widget)
					// replace our widget in place
					let match = _widgets.findIndex((w) => w.id === widget.id)
					if (match !== -1) {
						_widgets[match] = widget
						_widgetIds[widget.id] = widget
					}
					deferred.resolve(widget)
				}
			})
		} else {
			let args = [params.widget_id, params.name, params.qset, params.is_draft]
			Materia.Coms.Json.send('widget_instance_new', args).then((widget) => {
				if (widget != null) {
					// add to widgets
					_initSearchCache(widget)
					_widgets.push(widget)
					_widgetIds[widget.id] = widget
					deferred.resolve(widget)
				}
			})
		}

		return deferred.promise
	}

	const removeWidget = (inst_id) => {
		let selectedIndex
		let index = -1
		_widgets = _widgets.filter((widget, i) => {
			if (widget.id === inst_id) {
				index = i
				return false
			}
			return true
		})

		if (index === -1) {
			// not found
			return
		}
		if (index === 0) {
			// first item, when it's gone, select the first one again
			selectedIndex = 0
		} else {
			// select the item after the one we delete
			selectedIndex = index - 1
		}

		const newSelectedWidget = _widgets[selectedIndex]
		if (newSelectedWidget) {
			updateHashUrl(newSelectedWidget.id)
			sortWidgets()
		}
		$rootScope.$broadcast('widgetList.update')
	}

	const _initSearchCache = (widget) => {
		widget.searchCache = `${widget.id} ${widget.widget.name} ${widget.name}`.toLowerCase()
	}

	const _getSingleWidgetFromServer = (id) => {
		return Materia.Coms.Json.send('widget_instances_get', [[id]]).then((widgets) => {
			if (!widgets || !widgets.length) {
				let d = $q.defer()
				d.reject()
				return d.promise
			}
			let widget = widgets[0]
			_initSearchCache(widget)
			return widget
		})
	}

	const _getMultipleFromServer = () => {
		const deferred = $q.defer()
		Materia.Coms.Json.send('widget_instances_get', null).then((widgets) => {
			if (widgets && widgets.length > 0 && widgets.length >= _widgets.length) {
				let index = 0

				widgets.forEach((w) => {
					_initSearchCache(w)
					_widgetIds[w.id] = w
					_widgets.splice(index, 1, w)
					index++
				})
			}

			if (widgets.length < _widgets.length) {
				_widgets = widgets
			}

			deferred.resolve(_widgets)
		})

		return deferred.promise
	}

	const updateHashUrl = (widgetId) => ($window.location.hash = `/${widgetId}`)

	const convertAvailibilityDates = (startDateInt, endDateInt) => {
		let endDate, endTime, open_at, startTime
		startDateInt = ~~startDateInt
		endDateInt = ~~endDateInt
		endDate = endTime = 0
		open_at = startTime = 0

		if (endDateInt > 0) {
			endDate = DateTimeServ.parseObjectToDateString(endDateInt)
			endTime = DateTimeServ.parseTime(endDateInt)
		}

		if (startDateInt > 0) {
			open_at = DateTimeServ.parseObjectToDateString(startDateInt)
			startTime = DateTimeServ.parseTime(startDateInt)
		}

		return {
			start: {
				date: open_at,
				time: startTime,
			},
			end: {
				date: endDate,
				time: endTime,
			},
		}
	}

	// @TODO navigation should be moved out of this method
	const selectWidgetFromHashUrl = () => {
		if ($window.location.hash) {
			let selID = $window.location.hash.substr(1)
			if (selID.substr(0, 1) === '/') {
				selID = selID.substr(1)
			}
			getWidget(selID)
				.then((widget) => {
					SelectedWidgetSrv.set(widget)
				})
				.catch(() => {
					SelectedWidgetSrv.notifyAccessDenied()
				})
		}
	}

	const canBePublishedByCurrentUser = (widget_id) => {
		const deferred = $q.defer()
		Materia.Coms.Json.send('widget_publish_perms_verify', [widget_id]).then((response) => {
			deferred.resolve(response)
		})

		return deferred.promise
	}

	return {
		getWidgets,
		getWidgetsByType,
		getWidget,
		getWidgetInfo,
		lockWidget,
		sortWidgets,
		saveWidget,
		removeWidget,
		updateHashUrl,
		selectWidgetFromHashUrl,
		convertAvailibilityDates,
		copyWidget,
		deleteWidget,
		canBePublishedByCurrentUser,
	}
})
