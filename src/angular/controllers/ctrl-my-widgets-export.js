const app = angular.module('materia')
// The modal that exports score CSVs on My Widgets
app.controller('MyWidgetsExportController', function (Please, $scope, SelectedWidgetSrv) {
	// Builds the initial version of the popup window
	const _buildPopup = () => {
		const wgt = $scope.selected.widget
		$scope.selectedId = wgt.id

		if ($scope.selected.scores.list.length === 0 || !$scope.selected.hasScores) {
			$scope.exportOpts = ['Questions and Answers', 'Referrer URLs']
		} else {
			let scores_only
			if (wgt.guest_access) {
				scores_only = 'All Scores'
			} else {
				scores_only = 'High Scores'
			}
			$scope.exportOpts = [scores_only, 'Full Event Log', 'Questions and Answers', 'Referrer URLs']
			if (
				(wgt.widget.meta_data.playdata_exporters != null
					? wgt.widget.meta_data.playdata_exporters.length
					: undefined) > 0
			) {
				$scope.exportOpts = $scope.exportOpts.concat(wgt.widget.meta_data.playdata_exporters)
			}
		}

		$scope.exportType = $scope.exportOpts[0]
		_getScores()
	}

	// Finds all the scores with a given game instance id
	const _getScores = () => {
		Materia.Coms.Json.send('score_summary_get', [$scope.selectedId]).then((summary) => {
			// Show export modal in callback because otherwise the text changes once the
			// callback is done
			$scope.show.exportModal = true
			// Fill in the semesters from the server
			$scope.semesters = []
			for (let s of Array.from(summary)) {
				const label = `${s.year} ${s.term}`
				const id = `${s.year}_${s.term}`
				$scope.semesters.push({
					label,
					id,
					checked: false,
				})
			}

			// First semester is checked by default unless there are no semesters
			if ($scope.semesters.length !== 0) {
				$scope.semesters[0].checked = true
			}

			$scope.onSelectedSemestersChange()
			Please.$apply()
		})
	}

	// Updates the header of the popup and the ids for the download button
	const _updateDownloadInfo = (checkedSemesters) => {
		// Get the labels from the checked Semesters
		const labels = checkedSemesters.map((e) => e.label)
		$scope.header = labels.join(', ')
		$scope.selectedSemesters = labels.join(',').replace(/\s/g, '-')
		if (checkedSemesters.length >= 3) {
			$scope.header = checkedSemesters[0].label + ' and ' + (checkedSemesters.length - 1) + ' more'
		}
	}

	// Updates the checkAll option depending on how many semesters are checked
	const _updateCheckAll = (checkedSemesters) => {
		$scope.checkedAll = checkedSemesters.length === $scope.semesters.length
	}

	// Called when semesters are checked or unchecked
	// Gets the checked semesters for the download information and checkAll
	const _onSelectedSemestersChange = () => {
		// Get the objects that have checked: true
		const checked = $scope.semesters.filter((e) => e.checked)
		_updateDownloadInfo(checked)
		_updateCheckAll(checked)
	}

	// Check or uncheck all semesters
	const _checkAll = () => {
		// Grab all of the checked semesters
		const checked = $scope.semesters.filter((e) => e.checked)
		angular.forEach(
			$scope.semesters,
			(semester) =>
				// If all of the semesters are checked, uncheck them all
				(semester.checked = checked.length !== $scope.semesters.length)
		)
		$scope.onSelectedSemestersChange()
	}

	// expose to scope
	$scope.checkedAll = false
	$scope.semesters = []
	$scope.showOptions = () => ($scope.options = !$scope.options)
	$scope.onSelectedSemestersChange = _onSelectedSemestersChange
	$scope.checkAll = _checkAll

	// initialize
	_buildPopup()
})
