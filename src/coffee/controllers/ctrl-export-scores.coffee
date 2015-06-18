app = angular.module 'materia'
# The modal that exports score CSVs on My Widgets
app.controller 'ExportScoresController', ($scope, selectedWidgetSrv) ->
	$scope.checkedAll = false
	$scope.semesters = []
	# Mock data for the example table
	$scope.mockData = [
			userID: "fw33255p", name: "Felix Wembly", score: "94"
		,
			userID: "gm42334a", name: "Gillis Mokey", score: "35"
		,
			userID: "ha432343s", name: "Herkimer Archbanger", score: "100"
		,
			userID: "fg3421tr", name: "Fiona Gobo", score: "100"
		,
			userID: "mr2342123d", name: "Marvin Red", score: "43"
		,
			userID: "mt343223o", name: "Morris Tosh", score: "93"
		,
			userID: "pf32343t3", name: "Phil Feenie", score: "67"
		,
			userID: "lf33422i", name: "Lou Firechief", score: "0"
		,
			userID: "cb3311rt", name: "Cantus Blundig", score: "59"
	]

	# Builds the initial version of the popup window
	buildPopup = ->
		$scope.selectedId = $scope.selected.widget.id
		$scope.exportOpts = JSON.parse $scope.selected.widget.widget.logs_export_methods
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
				label = s.year + ' ' + s.term
				id = s.year + '_' + s.term
				$scope.semesters.push
					label: label
					id: id
					checked: false

			# First semester is checked by default
			$scope.semesters[0].checked = true
			$scope.onSelectedSemestersChange()
			$scope.$apply()

	# Called when semesters are checked or unchecked
	# Gets the checked semesters for the download information and checkAll
	$scope.onSelectedSemestersChange = ->
		# Get the objects that have checked: true
		checked = $scope.semesters.filter (e) -> return e.checked
		$scope.updateDownloadInfo(checked)
		$scope.updateCheckAll(checked)

	# Updates the header of the popup and the ids for the download button
	$scope.updateDownloadInfo = (checkedSemesters) ->
		# Get the labels from the checked Semesters
		labels = checkedSemesters.map (e) -> return e.label
		$scope.header = labels.join(", ")
		$scope.ids = labels.join(",").replace(/\s/g, '-')

	# Updates the checkAll option depending on how many semesters are checked
	$scope.updateCheckAll = (checkedSemesters) ->
		if checkedSemesters.length == $scope.semesters.length
			$scope.checkedAll = true
		else
			$scope.checkedAll = false

	# Check or uncheck all semesters
	$scope.checkAll = ->
		# Grab all of the checked semesters
		checked = $scope.semesters.filter (e) -> return e.checked
		angular.forEach($scope.semesters, (semester) ->
			# If all of the semesters are checked, uncheck them all
			if checked.length == $scope.semesters.length
				semester.checked = false
			else
				semester.checked = true
		)
		$scope.onSelectedSemestersChange()

	# Show or hide the semesters slideout
	$scope.showOptions = ->
		$scope.options = !$scope.options

	# Formate and return the download link
	$scope.getDownloadLink = ->
		if $scope.ids
			link = "/scores/export/#{$scope.exportType.value}/#{$scope.selected.widget.id}/#{$scope.ids}"
		else
			link = "#"
		return link

	Namespace('Materia.MyWidgets').Csv =
		buildPopup : buildPopup

