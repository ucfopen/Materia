MyWidgets = angular.module 'MyWidgets'

MyWidgets.controller 'ExportScoresController', ($scope, selectedWidgetSrv) ->
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
	# Info for export type, default to csv
	$scope.exportSelect = [
			value: "csv", option: "Scores"
		,
			value: "raw", option: "All raw data"
	]
	$scope.exportType = $scope.exportSelect[0]

	init = (gateway) ->

	# Builds the initial version of the popup window
	buildPopup = ->
		$scope.selectedId = selectedWidgetSrv.get().id
		getScores()

	# Finds all the scores with a given game instance id
	getScores = ->
		Materia.Coms.Json.send 'score_summary_get', [$scope.selectedId], (summary) ->
			# Show export modal in callback because otherwise the text changes once the
			# callback is done
			$scope.$parent.$parent.showExportModal = true
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
			$scope.updateSemesters()
			$scope.$apply()

	# Sets the chosen semester to checked or not.
	# Needed so that the text can be clicked.
	$scope.changeSemester = (index) ->
		if $scope.semesters.length > 1
			$scope.semesters[index].checked = !$scope.semesters[index].checked
			$scope.updateSemesters()

	# Updates the header of the popup and the ids for the download button
	$scope.updateSemesters = ->
		# Get the objects that have checked: true
		checked = $scope.semesters.filter (e) -> return e.checked
		# Get the labels from the returned objects
		labels = checked.map (e) -> return e.label
		$scope.header = labels.join(", ")
		$scope.ids = labels.join(",").replace(/\s/g, '-')

	# Check or uncheck all semesters
	$scope.checkAll = ->
		angular.forEach($scope.semesters, (semester) ->
			semester.checked = !$scope.checkedAll
		)
		$scope.updateSemesters()

	# Show or hide the semesters slideout
	$scope.showOptions = ->
		$scope.options = !$scope.options

	# Formate and return the download link
	$scope.getDownloadLink = ->
		if $scope.ids
			link = "/scores/" + $scope.exportType.value + "/" + $scope.selectedWidget.id + "/" + $scope.ids
		else
			link = "#"
		return link

	Namespace('Materia.MyWidgets').Csv =
		init : init
		buildPopup : buildPopup
