app = angular.module 'materia'
# The modal that exports score CSVs on My Widgets
app.controller 'ExportScoresController', ($scope, selectedWidgetSrv) ->
	$scope.checkedAll = false
	$scope.semesters = []

	# Builds the initial version of the popup window
	buildPopup = ->
		wgt = $scope.selected.widget
		$scope.selectedId = wgt.id

		if $scope.selected.scores.list.length == 0 or !$scope.selected.hasScores
			$scope.exportOpts = ['Questions and Answers']
		else
			if wgt.guest_access then scores_only = 'All Scores' else scores_only = 'High Scores'
			$scope.exportOpts = [scores_only, 'Full Event Log', 'Questions and Answers']
			$scope.exportOpts = $scope.exportOpts.concat(wgt.widget.meta_data.playdata_exporters) if wgt.widget.meta_data.playdata_exporters?.length > 0

		$scope.exportType = $scope.exportOpts[0]
		getScores()

	# Finds all the scores with a given game instance id
	getScores = ->
		Materia.Coms.Json.send 'score_summary_get', [$scope.selectedId], (summary) ->
			# Show export modal in callback because otherwise the text changes once the
			# callback is done
			$scope.show.exportModal = true
			# Fill in the semesters from the server
			$scope.semesters = []
			for s in summary
				label = "#{s.year} #{s.term}"
				id = "#{s.year}_#{s.term}"
				$scope.semesters.push
					label: label
					id: id
					checked: false

			# First semester is checked by default
			$scope.semesters[0].checked = true
			$scope.onSelectedSemestersChange()
			$scope.$apply()

	# Updates the header of the popup and the ids for the download button
	updateDownloadInfo = (checkedSemesters) ->
		# Get the labels from the checked Semesters
		labels = checkedSemesters.map (e) -> return e.label
		$scope.header = labels.join(", ")
		$scope.selectedSemesters = labels.join(",").replace(/\s/g, '-')
		if checkedSemesters.length >=3
			$scope.header = checkedSemesters[0].label + " and " + (checkedSemesters.length-1) + " more"

	# Updates the checkAll option depending on how many semesters are checked
	updateCheckAll = (checkedSemesters) ->
		$scope.checkedAll = checkedSemesters.length == $scope.semesters.length

	# Called when semesters are checked or unchecked
	# Gets the checked semesters for the download information and checkAll
	$scope.onSelectedSemestersChange = ->
		# Get the objects that have checked: true
		checked = $scope.semesters.filter (e) -> return e.checked
		updateDownloadInfo(checked)
		updateCheckAll(checked)

	# Check or uncheck all semesters
	$scope.checkAll = ->
		# Grab all of the checked semesters
		checked = $scope.semesters.filter (e) -> return e.checked
		angular.forEach $scope.semesters, (semester) ->
			# If all of the semesters are checked, uncheck them all
			semester.checked = checked.length != $scope.semesters.length
		$scope.onSelectedSemestersChange()

	# Show or hide the semesters slideout
	$scope.showOptions = ->
		$scope.options = !$scope.options

	Namespace('Materia.MyWidgets').Csv =
		buildPopup : buildPopup
