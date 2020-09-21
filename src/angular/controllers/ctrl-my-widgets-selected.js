const app = angular.module('materia')
app.controller('MyWidgetsSelectedController', function (
	Please,
	$rootScope,
	$scope,
	$q,
	WidgetSrv,
	SelectedWidgetSrv,
	UserServ,
	$anchorScroll,
	ACCESS,
	Alert
) {
	const _popup = () => {
		if ($scope.selected.shareable && !$scope.selected.widget.is_draft) {
			$scope.show.availabilityModal = true
		}
	}

	// using 'function' here because this function is executed in another scope chain
	const _hideModal = function () {
		this.$parent.hideModal()
	}

	const _exportPopup = () => {
		// Do not show modal disabled
		$scope.show.exportModal = true
		Please.$apply()
	}

	const _copyWidget = () => {
		WidgetSrv.copyWidget(
			$scope.selected.widget.id,
			$scope.selected.copy_title,
			$scope.selected.copy_retain_access
		)
			.then((inst_id) => {
				$scope.show.copyModal = false
				return WidgetSrv.getWidget(inst_id)
			})
			.then((widget) => {
				$rootScope.$broadcast('widgetList.update')
				WidgetSrv.updateHashUrl(widget.id)
			})
			.catch(() => {
				// @TODO show an alert?
			})
	}

	const _deleteWidget = () => {
		WidgetSrv.deleteWidget($scope.selected.widget.id).then((results) => {
			if (results) {
				$scope.show.deleteDialog = false
				WidgetSrv.removeWidget($scope.selected.widget.id)
				Please.$apply()
			}
		})
	}

	const _editWidgetPromise = () => {
		return Materia.Coms.Json.send('widget_instance_edit_perms_verify', [
			$scope.selected.widget.id,
		]).then((response) => {
			if (response.is_locked) {
				$scope.alert.msg =
					'This widget is currently locked, you will be able to edit this widget when it is no longer being edited by somebody else.'
			} else {
				if ($scope.selected.widget.is_draft) {
					window.location = $scope.selected.edit
				} else {
					if (response.can_publish) $scope.show.editPublishedWarning = true
					else $scope.show.restrictedPublishWarning = true
				}
			}
			Please.$apply()
		})
	}

	const _editWidget = () => {
		if ($scope.selected.editable) {
			_editWidgetPromise()
		}

		return false
	}

	const _getEmbedLink = () => {
		if ($scope.selected.widget === null) {
			return ''
		}

		const width =
			String($scope.selected.widget.widget.width) !== '0'
				? $scope.selected.widget.widget.width
				: 800
		const height =
			String($scope.selected.widget.widget.height) !== '0'
				? $scope.selected.widget.widget.height
				: 600
		const draft = $scope.selected.widget.is_draft
			? `${$scope.selected.widget.widget.name} Widget`
			: $scope.selected.widget.name

		return `<iframe src='${BASE_URL}embed/${$scope.selected.widget.id}/${
			$scope.selected.widget.clean_name
		}?autoplay=${
			$scope.show.autoplayToggle ? true : false
		}' width='${width}' height='${height}' style='margin:0;padding:0;border:0;'></iframe>`
	}

	const _enableOlderScores = () => {
		$scope.show.olderScores = true
	}

	const _showCopyDialog = () => {
		if ($scope.selected.can.copy) {
			$scope.show.copyModal = true
		}
	}

	const _showDelete = () => {
		if ($scope.selected.can.delete) {
			$scope.show.deleteDialog = !$scope.show.deleteDialog
		}
	}

	const _showCollaboration = () => {
		const user_ids = []
		for (var user in $scope.perms.widget) {
			user_ids.push(user)
		}

		if ($scope.perms.stale) {
			return
		}

		$scope.perms.collaborators = []
		$scope.show.collaborationModal = true

		Materia.Coms.Json.send('user_get', [user_ids]).then((users) => {
			$scope.studentAccessible = false

			if (users.length != null) {
				// sort the users
				users.sort((a, b) => {
					if (
						a.first < b.first ||
						(a.first === b.first && a.last < b.last) ||
						(a.last === b.last && a.middle < b.middle)
					) {
						return -1
					}
					return 1
				})

				// setup each user
				for (user of Array.from(users)) {
					if (user.is_student) {
						$scope.studentAccessible = true
					}
					user.access = $scope.perms.widget[user.id][0]
					const timestamp = parseInt($scope.perms.widget[user.id][1], 10)
					user.expires = timestamp
					user.expiresText = getExpiresText(timestamp)
					user.gravatar = UserServ.getAvatar(user, 50)
				}

				$scope.perms.collaborators = users
			}

			Please.$apply()
			$scope.setupPickers()
		})
	}

	const _setupPickers = () =>
		// fill in the expiration link text & setup click event
		Array.from($scope.perms.collaborators).map((user) =>
			((user) => {
				return $(`.exp-date.user${user.id}`).datepicker({
					minDate: getDateForBeginningOfTomorrow(),
					onSelect(dateText, inst) {
						const timestamp = $(this).datepicker('getDate').getTime() / 1000
						user.expires = timestamp
						user.expiresText = getExpiresText(timestamp)
						Please.$apply()
					},
				})
			})(user)
		)

	const getDateForBeginningOfTomorrow = () => {
		const d = new Date()
		d.setDate(d.getDate() + 1)
		return new Date(d.getFullYear(), d.getMonth(), d.getDate())
	}

	const getExpiresText = (timestamp) => {
		timestamp = parseInt(timestamp, 10)
		if (!timestamp) {
			return 'Never'
		} else {
			return $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))
		}
	}

	const _removeExpires = (user) => {
		user.expires = null
		user.expiresText = getExpiresText(user.expires)
	}

	// Scope Vars

	// Displays a no-access message when attempting to access a widget without sharing permissions.
	$scope.$on('selectedWidget.notifyAccessDenied', () => {
		$scope.perms.error = true
		Please.$apply()
	})

	$scope.removeExpires = _removeExpires
	$scope.setupPickers = _setupPickers
	$scope.showCollaboration = _showCollaboration
	$scope.showDelete = _showDelete
	$scope.showCopyDialog = _showCopyDialog
	$scope.getEmbedLink = _getEmbedLink
	$scope.editWidget = _editWidget
	$scope.popup = _popup
	$scope.hideModal = _hideModal
	$scope.exportPopup = _exportPopup
	$scope.copyWidget = _copyWidget
	$scope.deleteWidget = _deleteWidget
	$scope.enableOlderScores = _enableOlderScores

	$scope.alert = Alert

	/* develblock:start */
	// these method are exposed for testing
	$scope.jestTest = {
		_editWidgetPromise,
	}
	/* develblock:end */
})
