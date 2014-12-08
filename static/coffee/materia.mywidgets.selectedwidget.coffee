# Handles the widget currently selected (on the big screeny thing)
# TODO: needs some serious refactoring to reduce complexity of large methods

MyWidgets = angular.module 'MyWidgets'
MyWidgets.controller 'SelectedWidgetController', ($scope, $q, $location, widgetSrv,selectedWidgetSrv, userSrv) ->

	# old stuff
	$scope.STORAGE_TABLE_MAX_ROWS_SHOWN = 100
	$scope.selectedWidgetInstId = 0
	$scope.scoreSummaries = {}
	$scope.semesterPlayLogs = {}
	$scope.storageData = {}
	$scope.selectedData = null
	$scope.dateRanges = null

	# refactoring scope variables
	$scope.perms = null
	$scope.scores = null

	$scope.selectedWidget = null # updated automagically with selectedWidgetSrv service
	$scope.$on 'selectedWidget.update', (evt) -> # hook to update selected widget when service updates
		$scope.selectedWidget = selectedWidgetSrv.get()
		setSelectedWidget()

	$scope.noWidgetState = false
	$scope.$on 'selectedWidget.noWidgets', (evt) ->
		$scope.noWidgetState = true
		$scope.$apply()

	$scope.user = null # grab current user, link it to service
	$scope.$on 'user.update', (evt) ->
		$scope.user = userSrv.get()
		# $scope.$apply() # required?

	# Flags to help condense conditional statement checks
	$scope.accessLevel = 0
	$scope.editable = true
	$scope.shareable = false
	$scope.hasScores = false

	$scope.storageNotScoreData = false
	$scope.hasStorage = false
	$scope.selectedScoreView = 0 # 0 is graph, 1 is table, 2 is data

	$scope.collaborators = 0

	$scope.baseUrl = BASE_URL

	$scope.popup = () ->
		console.log("hello")
		Materia.MyWidgets.Availability.popup()
		return

	# Initializes the gateway for the api
	# @string path to gateway
	init = (gateway) ->

		$('.show-older-scores-button').click (e) ->
			e.preventDefault()
			# Materia.MyWidgets.SelectedWidget.showAllScores()

	# This doesn't actually "set" the widget
	# It ensures required scope objects have been acquired before kicking off the display
	setSelectedWidget = ->

		$q.all([
			userSrv.get(),
			selectedWidgetSrv.getUserPermissions(),
			selectedWidgetSrv.getScoreSummaries(),
			selectedWidgetSrv.getDateRanges()
		])
		.then (data) ->
			$scope.user = data[0]
			$scope.perms = data[1]
			$scope.scores = data[2]

			Materia.MyWidgets.Statistics.clearGraphs()

			populateDisplay()

		# Moved to the sidebar controller(?) still needs to be implemented
		# if $('.page').is ':visible' and not $('section .error').is ':visible'
		# Materia.Set.Throbber.startSpin '.page'

	$scope.preview = ""
	$scope.edit = ""
	# TODO Attempting to use $location.url is NOT WORKING due to missing configs for html5Mode.
	# $scope.preview = "preview"
	# $scope.edit = "edit"
	# $scope.navigate = (type) ->
	# 	switch type
	# 		when $scope.preview
	# 			console.log $location.path()
	# 			#$location.url "edit/" + $scope.selectedWidget.id + "/" + $scope.selectedWidget.clean_name
	# 			$location.path "bitches"


	getCurrentSemester = ->
		return $scope.selectedData.year+' '+$scope.selectedData.term

	populateAttempts = (attemptsAllowed) ->
		attemptsAllowed = parseInt attemptsAllowed, 10
		$('#attempts').html(if attemptsAllowed > 0 then attemptsAllowed else 'Unlimited')

	populateAvailability = (startDateInt, endDateInt) ->
		#if $('section.directions').is(':visible')
			#$('section.directions').hide()
			#$('section.page').show()

		availability = Materia.Set.Availability.get(startDateInt, endDateInt)

		$availability = $('#avaliability')

		if endDateInt < 0 && startDateInt < 0
			$availability.removeAttr('data-type')
			$availability.html('Anytime')
		else if startDateInt < 0 && endDateInt > 0
			$availability.attr('data-type', 'endDateOnly')
			$availability.html('Open until <span class="available_date">'+availability.end.date+'</span> at <span class="available_time">'+availability.end.time+'</span>')
		else if startDateInt > 0 && endDateInt < 0
			start = new Date(startDateInt)
			$availability.attr('data-type', 'startDateOnly')
			$availability.html('Anytime after <span class="available_date">'+availability.start.date+'</span> at <span class="available_time">'+availability.start.time+'</span>')
		else
			start = new Date(startDateInt)
			end = new Date(endDateInt)
			$availability.removeAttr('data-type')
			$availability.html('From <span class="available_date">'+availability.start.date+'</span> at <span class="available_time">'+availability.start.time+'</span> until <span class="available_date">'+availability.end.date+'</span> at <span class="available_time">'+availability.end.time+'</span>')

	# Displays a no-access message when attempting to access a widget without sharing permissions.
	noAccess = ->
		#$('section.page').children().hide()

		#if($('section.directions').is(':visible'))
			#$('section.directions').hide()
			#$('section.page').show()

		#  put the error template on screen
		#$('section.page').append($('#t-error').html())

	# Shows selected game information on the mainscreen.
	# @param   element   The element that was clicked ($('.widget_list').children('div'))
	populateDisplay = (id) ->
		count = null
		# widgetID = null

		if $('section .error').is(':visible') then $('section .error').remove()

		Materia.Coms.Json.send 'session_valid', ['basic_author'], (data) ->
				# This reference is staying until it's not needed...
				$editButton = $('#edit_button')

				# accessLevel == 0 is effectively read-only
				if typeof $scope.perms.user[$scope.user.id] != 'undefined' and typeof $scope.perms.user[$scope.user.id][0] != 'undefined'
					$scope.accessLevel = Number $scope.perms.user[$scope.user.id][0]
					# $scope.accessLevel = 0

				$scope.preview = "preview/" + $scope.selectedWidget.id + "/" + $scope.selectedWidget.clean_name

				# edit button should be disabled IF:
					# - accesslevel == 0
					# - is_editable flag is 0
				$scope.editable = ($scope.accessLevel > 0 and parseInt($scope.selectedWidget.widget.is_editable) is 1)

				if $scope.editable
					$scope.edit = "edit/" + $scope.selectedWidget.id + "/" + $scope.selectedWidget.clean_name
				else
					$scope.edit = "#"

				$scope.shareable = !($scope.accessLevel == 0 || $scope.selectedWidget.is_draft == true)
				# $scope.$apply()

				if $scope.shareable
					# $('#edit-avaliability-button').unbind('click')
					# $('#attempts').unbind('click')
					# $('#avaliability').unbind('click')
					jqmodalOptions =
						modal            : true,
						backgroundStyle  : 'light',
						className        : 'availability',
						html             : $('#t-availibility').html(),
						closingSelectors : ['.cancel_button']

					# TODO: Replace with ng-modal functionality
					$('#edit-avaliability-button').jqmodal(jqmodalOptions, Materia.MyWidgets.Availability.popup)
					$('#attempts').jqmodal(jqmodalOptions, Materia.MyWidgets.Availability.popup)
					$('#avaliability').jqmodal(jqmodalOptions, Materia.MyWidgets.Availability.popup)

				# count up the number of other users collaboratin
				count = 0
				for id of $scope.perms.widget
					if id != $scope.user.id then count++

				$scope.copy_title = $scope.selectedWidget.name + " copy"
				$scope.collaborateCount = if count > 0 then ' ('+count+')' else ''
				$scope.$apply()

				# TODO: Fix dis
				populateAvailability($scope.selectedWidget.open_at, $scope.selectedWidget.close_at)
				populateAttempts($scope.selectedWidget.attempts)

				$scope.selectedWidget.iconbig = Materia.Image.iconUrl $scope.selectedWidget.widget.dir, 275
				$scope.$apply()

				#  Bind the edit button
				# $editButton.attr('href', BASE_URL + 'edit/'+$scope.selectedWidgetInstId+'/'+$scope.selectedWidget.clean_name)
				# $editButton.unbind('click')

				$scope.shareable = !$scope.selectedWidget.is_draft
				# $scope.$apply()
				if !$scope.shareable
					console.log "Widget is UNPLAYABLE"
					# $('.share-widget-container')
					# 	.addClass('draft')
					# 	.fadeTo('fast', 0.3)
					# 	.children('h3')
					# 	.html('Publish to share with your students')

					# $('#play_link').attr('disabled', 'disabled')

					# TODO replace dis
					$editButton.click ->
						Materia.Coms.Json.send 'widget_instance_lock',[$scope.selectedWidgetInstId], (success) ->
							if success
								window.location = $editButton.attr('href')
							else
								alert('This widget is currently locked you will be able to edit this widget when it is no longer being edited by somebody else.')

				# update display if playable
				# TODO: this case should probably be combined with the is not a draft case below?
				else
					console.log "Widget is PLAYABLE"
					# $('.share-widget-container')
					# 	.removeClass('draft')
					# 	.fadeTo('fast', 1)
					# 	.children('h3')
					# 	.html('Share with your students')

					$('#play_link')
						# .unbind('click')
						# .val(BASE_URL + 'play/'+String($scope.selectedWidgetInstId)+'/'+$scope.selectedWidget.clean_name)
						.click(->$(this).select())

					# $('#embed_link')
					# 	.unbind('click')
					# 	.val(getEmbedLink($scope.selectedWidget))
					# 	.click(->$(this).select())

					# $('.share-widget-container input').removeAttr('disabled')

				# TODO Temporary
				if $scope.editable
					$editButton.jqmodal
						modal            : true,
						backgroundStyle  : 'light',
						className        : 'edit-published-widget',
						html             : $('#t-edit-widget-published').html(),
						closingSelectors : ['.cancel_button']
					, ->
						# $('.edit-published-widget .action_button').attr('href', $editButton.attr('href'))

				# TODO: this case should probably be combined with the else case above?
				# TODO: Determine if this note is still relevant ^
				if !$scope.selectedWidget.widget.is_draft
					# $('.my_widgets .page .scores').show()
					$('.my_widgets .page .embed').show() # WHERE IS THIS??

					#  reset scores & data ui:
					$scoreWrapper = $('.scoreWrapper')
					$scoreWrapper.slice(1).remove() if $scoreWrapper.length > 1

					# $('.show-older-scores-button').hide()
					# $('.chart').attr('id', '').empty()

					# getScoreSummaries $scope.selectedWidgetInstId, (data) ->

					# $('#export_scores_button').unbind()
					$exportScoresButton = $('#export_scores_button')
					console.log $scope.scores

					#  no data
					# if $scope.scores.list.length == 0
					# 	console.log "list length = 0"
					# else

					## MASTER SCOPE APPLY CALL
					$scope.$apply()

					if $scope.scores.list.length > 0
						# TODO populateScoreWrapper should be called via ng-repeat for all semester instances
						populateScoreWrapper()

						# hasScores = false

						for d in $scope.scores.list # is this check necessary? Is there ever a use case where a list object won't have a distro array?
							if d.distribution?
								$scope.hasScores = true
								break

						# if hasScores
						# 	$exportScoresButton.removeClass('disabled')
						# else
						# 	$exportScoresButton.addClass('disabled')

						# TODO Replace jqmodal
						$('#export_scores_button:not(".disabled")').jqmodal
							modal            : true,
							className        : 'csv_popup',
							html             : $('#t-csv').html(),
							closingSelectors : ['.cancel','.download']
						, ->
							Materia.MyWidgets.Csv.buildPopup()
				else
					# $('.my_widgets .page .scores').hide()
					$('.my_widgets .page .embed').hide() # WHERE IS THIS???

				# Materia.Set.Throbber.stopSpin('.page')

	$scope.copyWidget = () ->
		Materia.MyWidgets.Tasks.copyWidget $scope.selectedWidget.id, $scope.copy_title, (inst_id) ->
			$scope.copyToggled = false
			widgetSrv.addWidget(inst_id)
			$scope.$apply()

	$scope.deleteWidget = ->
		Materia.MyWidgets.Tasks.deleteWidget $scope.selectedWidget.id, (results) ->
			if results
				$scope.deleteToggled = false
				widgetSrv.removeWidget($scope.selectedWidget.id)
				$scope.$apply()

	$scope.getEmbedLink = ->
		if $scope.selectedWidget is null then return ""

		width = if String($scope.selectedWidget.widget.width) != '0' then  $scope.selectedWidget.widget.width else 800
		height = if String($scope.selectedWidget.widget.height) != '0' then $scope.selectedWidget.widget.height else 600
		draft = if $scope.selectedWidget.is_draft then "#{$scope.selectedWidget.widget.name} Widget" else $scope.selectedWidget.name

		"<iframe src='#{BASE_URL}embed/#{$scope.selectedWidget.id}/#{$scope.selectedWidget.clean_name}' width='#{width}' height='#{height}' style='margin:0;padding:0;border:0;'><a href='#{BASE_URL}play/#{$scope.selectedWidget.id}/#{$scope.selectedWidget.clean_name}'>#{draft}</a></iframe>"

	# loadDateRanges = ->
	# 	unless $scope.dateRanges?
	# 		Materia.Coms.Json.send 'semester_date_ranges_get', [], (data) ->
	# 			$scope.dateRanges = data

	toggleShareWidgetContainer = (state) ->
		$shareWidgetContainer = $('.share-widget-container')

		unless state?
			state = $shareWidgetContainer.hasClass('closed') ? 'open' : 'close'

		if state == 'open'
			$shareWidgetContainer.switchClass('closed', '', 200)
		else if state == 'close'
			$shareWidgetContainer.switchClass('', 'closed', 200)

	populateScoreWrapper = () ->

		# un-temporary dis
		# data should be a reference to whatever semester is being used for this particular chart
		data = $scope.scores.last

		# don't think these will be necessary eventually
		# $scoreWrapper.attr('data-semester', data.id)
		# $scoreWrapper.attr('data-semester-str', createSemesterString(data))
		# $scoreWrapper.find('.view').html(data.term+' '+data.year)

		#  no scores, but we do have storage data
		if typeof data.distribution == 'undefined' and typeof data.storage != 'undefined'
			$scope.storageNotScoreData = true

			# $scoreWrapper.show()

			# $scoreWrapper.find('li:nth-child(1) a').hide()
			# $scoreWrapper.find('li:nth-child(2) a').hide()
			# $scoreWrapper.find('li:nth-child(3) a').show()

			# $scope.setScoreView(data.id, $scope.viewData)
			$scope.setScoreView(2) # TODO eventually needs a reference to the proper semester

		else #  has scores, might have storage data
			# $scoreWrapper.show()

			# $scoreWrapper.find('li:nth-child(1) a').show()
			# $scoreWrapper.find('li:nth-child(2) a').show()

			if typeof data.storage == 'undefined' then $scope.hasStorage = true

			# console.log $scope.hasStorage
				# $scoreWrapper.find('li:nth-child(3) a').hide()
			# else
			# 	$scoreWrapper.find('li:nth-child(3) a').show()

			# $scoreWrapper.find('.chart').attr('id', 'chart_' + data.id)

			$scope.setScoreView(0)

	processDataIntoSemesters = (logs, getTimestampFunction) ->
		semesters = {}
		timestamp = null

		$.each logs, (i, log) ->
			timestamp = getTimestampFunction(log)
			logMeta = getSemesterFromTimestamp(timestamp)
			semesterString = logMeta.year + ' ' + logMeta.semester.toLowerCase()

			if(!semesters[semesterString])
				semesters[semesterString] = []
			semesters[semesterString].push(log)
		return semesters

	getSemesterFromTimestamp = (timestamp) ->
		for range in $scope.dateRanges
			return range if timestamp >= parseInt(range.start, 10) && timestamp <= parseInt(range.end, 10)
		return undefined

	#  storage data doesn't really enforce a schema.
	#  this function determines every field used throughout the
	#  storage data and then applies that schema to each item.
	normalizeStorageDataColumns = (rows) ->
		#  go through all the rows and collect the fields used:
		curRow
		fields = {}
		for r in rows
			curRow = r.data
			for j in curRow
				if typeof j == 'undefined'
					j = null

		#  now go through each row again and add in the missing fields
		for r in rows
			r.data = $.extend({}, fields, r.data)

		rows

	$scope.setScoreView = (view) ->

		$scope.selectedScoreView = view
		# $scope.$apply()
		# $scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
		# $scoreWrapper.attr('data-score-view', newScoreView)

		# $scoreWrapper.find('.choices li.scoreTypeSelected').removeClass('scoreTypeSelected')
		# $scoreWrapper.find('.display.table').hide()
		# $scoreWrapper.find('.display.graph').hide()
		# $scoreWrapper.find('.display.data').hide()

		switch view
			when 0 # graph
				# getScoreSummaries $scope.selectedWidgetInstId, (data) ->
				# Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"]"')
				brackets = $scope.scores.map[$scope.scores.last.id].distribution # TODO replace scores.last with dynamic reference

				Materia.MyWidgets.Statistics.createGraph('chart_' + $scope.scores.last.id, brackets) # TODO replace scores.last with dynamic reference

			when 1 # table
				deferredPlayLogs = selectedWidgetSrv.getPlayLogsForSemester $scope.scores.map[$scope.scores.last.id].term, $scope.scores.map[$scope.scores.last.id].year
				deferredPlayLogs.then (data) ->

					tableSort = 'desc'

					Materia.MyWidgets.Statistics.createTable('table_'+$scope.scores.last.id, data, tableSort, $scope.selectedWidget.id)

		# switch newScoreView
		# 	when 'graph'
		# 		# $scoreWrapper.find('.display.graph').show()
		# 		# # $scoreWrapper.find('.choices li:first-child').addClass('scoreTypeSelected')
		# 		# $scoreWrapper.find('.numeric li').show()
		# 	when 'table'
		# 		# $scoreWrapper.find('.display.table').show()
		# 		# # $scoreWrapper.find('.choices li:nth-child(2)').addClass('scoreTypeSelected')
		# 		# $scoreWrapper.find('.numeric li').show()
		# 	when 'data'
		# 		# $scoreWrapper.find('.display.data').show()
		# 		# # $scoreWrapper.find('.choices li:nth-child(3)').addClass('scoreTypeSelected')
		# 		# $scoreWrapper.find('.numeric li').hide()

		# updateSemesterScores(semester)

	updateSemesterScores = (semester) ->

		# Everything below will be effectively deprecated
		$scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
		scoreView = $scoreWrapper.attr('data-score-view')

		switch scoreView
			when 'table' then updateTable($scoreWrapper)
			when 'data' then updateData($scoreWrapper)
			else
				updateGraph($scoreWrapper)
		# Everything above will be effectively deprecated

		# updateSummary(semester)

	# getScoreSummaries = (inst_id, callback) ->
	# 	#  if we didn't already get this data, get it now
	# 	if typeof $scope.scoreSummaries[inst_id] == 'undefined'
	# 		Materia.Coms.Json.send 'score_summary_get', [inst_id, true], (data) ->
	# 			if(data != null && data.length > 0)
	# 				o = {}
	# 				last = data[0].id
	# 				for d in data
	# 					o[d.id] = d
	# 				#  we more conviently store the data in an array (list) and an object (map).
	# 				#  list is an ordered list of summary data by semesters (in descending order).
	# 				#  map is an object where the semester_id (database semester code) is the key.
	# 				$scope.scoreSummaries[inst_id] = {list:data, map:o, last:data[0]}
	# 				# scoreSummaries[inst_id] = data
	# 			else
	# 				$scope.scoreSummaries[inst_id] = {list:[], map:{}, last:undefined}
	# 			callback($scope.scoreSummaries[inst_id])
	# 	else
	# 		callback($scope.scoreSummaries[inst_id])

	getPlayLogs = (inst_id, semester, year, callback) ->
		# key our logs off of semester+year+instanceID
		logKey = "#{semester}_#{year}_#{inst_id}"
		# If we haven't loaded them yet, load em
		unless $scope.semesterPlayLogs[logKey]?
			Materia.Coms.Json.send 'play_logs_get', [inst_id, semester, year], (logs) ->
				$scope.semesterPlayLogs[logKey] = processDataIntoSemesters(logs, (o) -> return o.time)
				callback $scope.semesterPlayLogs[logKey]
		else
			callback $scope.semesterPlayLogs[logKey]

	getStorageData = (inst_id, callback) ->
		if typeof $scope.storageData[inst_id] == 'undefined'
			Materia.Coms.Json.send 'play_storage_get', [inst_id], (data) ->
				$scope.storageData[inst_id] = {}
				temp = {}
				getPlayTime = (o) -> return o.play.time
				#table
				#semester

				for tableName, tableData of data
					temp[tableName] = processDataIntoSemesters(tableData, getPlayTime)
				for tableName, semestersData of temp
					for semesterId, semesterData of semestersData
						if typeof $scope.storageData[inst_id][semesterId] == 'undefined'
							$scope.storageData[inst_id][semesterId] = {}
						if semesterData.length > STORAGE_TABLE_MAX_ROWS_SHOWN
							$scope.storageData[inst_id][semesterId][tableName] = {truncated:true, total:semesterData.length, data:semesterData.slice(0, STORAGE_TABLE_MAX_ROWS_SHOWN)}
						else
							$scope.storageData[inst_id][semesterId][tableName] = {truncated:false, data:semesterData}

						$scope.storageData[inst_id][semesterId][tableName].data = normalizeStorageDataColumns($scope.storageData[inst_id][semesterId][tableName].data)

				callback($scope.storageData[inst_id])
		else
			callback($scope.storageData[inst_id])

	# updateSummary = (semester) ->
	# 	getScoreSummaries $scope.selectedWidgetInstId, (data) ->
	# 		semesterData = data.map[semester]
	# 		$scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
	# 		plays = 0

	# 		if semesterData.students?
	# 			$scoreWrapper.find('.players').html(semesterData.students)
	# 		if semesterData.average?
	# 			$scoreWrapper.find('.final-average').html(semesterData.average)

	# 		if semesterData.distribution?
	# 			plays += dis for dis in semesterData.distribution
	# 			$scoreWrapper.find('.score-count').html(plays)

	updateGraph = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"]"')

		getScoreSummaries $scope.selectedWidgetInstId, (data) ->
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"]"')
			brackets = data.map[semester].distribution
			Materia.MyWidgets.Statistics.createGraph('chart_' + semester, brackets)

	updateTable = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		semesterStr = $scoreWrapper.attr('data-semester-str')

		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"] .display.table')
		getPlayLogs $scope.selectedWidgetInstId, semesterStr.split('_')[1], semesterStr.split('_')[0], (logsBySemester) ->
			$table = $scoreWrapper.find('.display.table')
			tableSort = $table.attr('data-sort')
			Materia.MyWidgets.Statistics.createTable($table, logsBySemester[semesterStr.replace('_', ' ')], tableSort, $scope.selectedWidgetInstId)
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"] .display.table')

	updateData = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		semesterStr = $scoreWrapper.attr('data-semester-str')
		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"] .data')
		getStorageData $scope.selectedWidgetInstId, (data) ->
			createStorageDataTables(data[semesterStr.replace('_', ' ')], $scoreWrapper.find('.display.data'))
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"] .data')

	createStorageDataTables = (tables, $element) ->
		$element.empty()

		tableNames = []
		$label = $('<div class="table-label"><h4>Table:</h4></div>')
		$select = null

		tableNames.push(tableName) for tableName, tableData of tables

		if tableNames.length == 1
			$label.append('<span>' + tableNames[0] + '</span>')
		else
			$select = $('<select></select>')
			for name in tableNames
				$select.append('<option value="'+name+'">'+name+'</option>')

			$select.change (event) ->
				semester = $(event.target).parents('.scoreWrapper').attr('data-semester-str')
				selectedTableName = $(event.target).find(':selected').val()
				getStorageData $scope.selectedWidgetInstId, (data) ->
					createStorageDataTable(data[semester.toLowerCase().replace('_', ' ')][selectedTableName], $element)
			$label.append($select)

		$element.append($label)
		$element.prepend('<a class="storage">Download Table</a>')

		$('.storage').click (event) ->
			event.preventDefault()

			$scoreWrapper = $(event.target).parents('.scoreWrapper')
			$tableLabel = $scoreWrapper.find('.table-label')
			table = ''
			if($tableLabel.find('select').length > 0)
				table = $tableLabel.find('select').val()
			else
				table = $tableLabel.find('span').text()
			if table != ''
				semester = $scoreWrapper.attr('data-semester-str').replace('_', '-')
				window.location = '/scores/storage/' + $scope.selectedWidgetInstId + '/' + table + '/' + semester
		createStorageDataTable(tables[tableNames[0]], $element)

	createStorageDataTable = (tableObject, $element) ->
		$element.find('.dataTables_wrapper').remove()

		$element.find('.truncated-table').remove()
		if(tableObject.truncated)
			$element.append('<p class="truncated-table">Showing only the first ' + STORAGE_TABLE_MAX_ROWS_SHOWN + ' entries of this table. Download the table to see all ' + tableObject.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' entries.</p>')

		rows = tableObject.data

		if(rows.length > 0)
			$table = $('<table></table>')
			$headers = $('<tr><th>user</th><th>firstName</th><th>lastName</th><th>time</th></tr>')
			$tbody = $('<tbody></tbody>')
			$curTr
			nullValue
			len = rows.length

			$headers.append('<th>' + rowName + '</th>') for rowName, rowData of rows[0].data

			$headers.wrap('<thead>')
			$table.append($headers.parent())

			for row in rows
				$curTr = $('<tr><td>'+row.play.user+'</td><td>'+row.play.firstName+'</td><td>'+row.play.lastName+'</td><td>'+row.play.time+'</td></tr>')
				for fieldName, fieldData of row.data
					nullValue = fieldData == null
					if nullValue
						fieldData = '--'

					$curTr.append('<td'+( if nullValue then ' class="null"' else '')+'>'+fieldData+'</td>')

				$tbody.append($curTr)

			$table.append($tbody)
			$element.append($table)
			$table.dataTable
				sScrollX: '100%'

	toggleTableSort = (semester) ->
		$scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
		$table = $scoreWrapper.find('.display.table')
		tableSort = $table.attr('data-sort')

		if ($(this).hasClass('up'))
			$(this).removeClass('up').addClass('down')
		else if ($(this).hasClass('down'))
			$(this).removeClass('down').addClass('up')

		$table.attr('data-sort', if tableSort == 'desc' then 'asc' else 'desc')
		updateTable($scoreWrapper)

	showAllScores = ->
		getScoreSummaries $scope.selectedWidgetInstId, (data) ->
			$semester = $('.scoreWrapper')
			$scores = $('.scores')

			$('.show-older-scores-button').hide()

			# TODO Replace this with ng-repeat
			for i in [1..data.list.length-1]
				$clone = $semester.clone()
				$scores.append($clone)

				# populateScoreWrapper($clone, data.list[i])

	updateSummary = (semester) ->
		getScoreSummaries $scope.selectedWidgetInstId, (data) ->
			semesterData = data.map[semester]
			$scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
			plays = 0

			if semesterData.students?
				$scoreWrapper.find('.players').html(semesterData.students)
			if semesterData.average?
				$scoreWrapper.find('.final-average').html(semesterData.average)

			if semesterData.distribution?
				plays += dis for dis in semesterData.distribution
				$scoreWrapper.find('.score-count').html(plays)

	updateGraph = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"]"')

		getScoreSummaries $scope.selectedWidgetInstId, (data) ->
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"]"')
			brackets = data.map[semester].distribution
			Materia.MyWidgets.Statistics.createGraph('chart_' + semester, brackets)

	updateTable = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		semesterStr = $scoreWrapper.attr('data-semester-str')

		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"] .display.table')
		getPlayLogs $scope.selectedWidgetInstId, semesterStr.split('_')[1], semesterStr.split('_')[0], (logsBySemester) ->
			$table = $scoreWrapper.find('.display.table')
			tableSort = $table.attr('data-sort')
			Materia.MyWidgets.Statistics.createTable($table, logsBySemester[semesterStr.replace('_', ' ')], tableSort, $scope.selectedWidgetInstId)
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"] .display.table')

	updateData = ($scoreWrapper) ->
		semester = $scoreWrapper.attr('data-semester')
		semesterStr = $scoreWrapper.attr('data-semester-str')
		Materia.Set.Throbber.startSpin('.scoreWrapper[data-semester="' + semester + '"] .data')
		getStorageData $scope.selectedWidgetInstId, (data) ->
			createStorageDataTables(data[semesterStr.replace('_', ' ')], $scoreWrapper.find('.display.data'))
			Materia.Set.Throbber.stopSpin('.scoreWrapper[data-semester="' + semester + '"] .data')

	createStorageDataTables = (tables, $element) ->
		$element.empty()

		tableNames = []
		$label = $('<div class="table-label"><h4>Table:</h4></div>')
		$select = null

		tableNames.push(tableName) for tableName, tableData of tables

		if tableNames.length == 1
			$label.append('<span>' + tableNames[0] + '</span>')
		else
			$select = $('<select></select>')
			for name in tableNames
				$select.append('<option value="'+name+'">'+name+'</option>')

			$select.change (event) ->
				semester = $(event.target).parents('.scoreWrapper').attr('data-semester-str')
				selectedTableName = $(event.target).find(':selected').val()
				getStorageData $scope.selectedWidgetInstId, (data) ->
					createStorageDataTable(data[semester.toLowerCase().replace('_', ' ')][selectedTableName], $element)
			$label.append($select)

		$element.append($label)
		$element.prepend('<a class="storage">Download Table</a>')

		$('.storage').click (event) ->
			event.preventDefault()

			$scoreWrapper = $(event.target).parents('.scoreWrapper')
			$tableLabel = $scoreWrapper.find('.table-label')
			table = ''
			if($tableLabel.find('select').length > 0)
				table = $tableLabel.find('select').val()
			else
				table = $tableLabel.find('span').text()
			if table != ''
				semester = $scoreWrapper.attr('data-semester-str').replace('_', '-')
				window.location = '/scores/storage/' + $scope.selectedWidgetInstId + '/' + table + '/' + semester
		createStorageDataTable(tables[tableNames[0]], $element)

	createStorageDataTable = (tableObject, $element) ->
		$element.find('.dataTables_wrapper').remove()

		$element.find('.truncated-table').remove()
		if(tableObject.truncated)
			$element.append('<p class="truncated-table">Showing only the first ' + STORAGE_TABLE_MAX_ROWS_SHOWN + ' entries of this table. Download the table to see all ' + tableObject.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' entries.</p>')

		rows = tableObject.data

		if(rows.length > 0)
			$table = $('<table></table>')
			$headers = $('<tr><th>user</th><th>firstName</th><th>lastName</th><th>time</th></tr>')
			$tbody = $('<tbody></tbody>')
			$curTr
			nullValue
			len = rows.length

			$headers.append('<th>' + rowName + '</th>') for rowName, rowData of rows[0].data

			$headers.wrap('<thead>')
			$table.append($headers.parent())

			for row in rows
				$curTr = $('<tr><td>'+row.play.user+'</td><td>'+row.play.firstName+'</td><td>'+row.play.lastName+'</td><td>'+row.play.time+'</td></tr>')
				for fieldName, fieldData of row.data
					nullValue = fieldData == null
					if nullValue
						fieldData = '--'

					$curTr.append('<td'+( if nullValue then ' class="null"' else '')+'>'+fieldData+'</td>')

				$tbody.append($curTr)

			$table.append($tbody)
			$element.append($table)
			$table.dataTable
				sScrollX: '100%'

	toggleTableSort = (semester) ->
		$scoreWrapper = $('.scoreWrapper[data-semester="' + semester + '"]')
		$table = $scoreWrapper.find('.display.table')
		tableSort = $table.attr('data-sort')

		if ($(this).hasClass('up'))
			$(this).removeClass('up').addClass('down')
		else if ($(this).hasClass('down'))
			$(this).removeClass('down').addClass('up')

		$table.attr('data-sort', if tableSort == 'desc' then 'asc' else 'desc')
		updateTable($scoreWrapper)

	# showAllScores = ->
	# 	getScoreSummaries $scope.selectedWidgetInstId, (data) ->
	# 		$semester = $('.scoreWrapper')
	# 		$scores = $('.scores')

	# 		$('.show-older-scores-button').hide()

	# 		for i in [1..data.list.length-1]
	# 			$clone = $semester.clone()
	# 			$scores.append($clone)
	# 			populateScoreWrapper($clone, data.list[i])

	createSemesterString = (o) ->
		return (o.year + '_' + o.term).toLowerCase()

	getDateForBeginningOfTomorrow = ->
		d = new Date()
		d.setDate(d.getDate() + 1)
		new Date(d.getFullYear(), d.getMonth(), d.getDate())

	$scope.showCollaboration = ->
		user_ids = []
		for user of $scope.perms.widget
			user_ids.push user
		$scope.collaborators = []

		Materia.Coms.Json.send 'user_get', [user_ids], (users) ->
			users.sort (a,b) ->
				if(a.first < b.first || (a.first == b.first && a.last < b.last) || (a.last == b.last && a.middle < b.middle))
					return -1
				return 1

			for user in users
				user.access = $scope.perms.widget[user.id][0]
				timestamp = parseInt($scope.perms.widget[user.id][1], 10)
				user.expires = timestamp
				user.expiresText = if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))
				user.gravatar = getGravatar(user.email)

			$scope.collaborators = users
			$scope.$apply()

			$scope.setupPickers()

		$scope.showCollaborationModal = true

	$scope.setupPickers = ->
		# fill in the expiration link text & setup click event
		for user in $scope.collaborators
			$(".exp-date.user" + user.id).datepicker
				minDate: getDateForBeginningOfTomorrow()
				onSelect: (dateText, inst) ->
					timestamp = $(this).datepicker('getDate').getTime() / 1000
					user.expires = timestamp
					user.expiresText = getExpiresText(timestamp)
					$scope.$apply()

	$scope.removeExpires = (user) ->
		user.expires = null
		user.expiresText = getExpiresText(user.expires)

	getExpiresText = (timestamp) ->
		timestamp = parseInt(timestamp, 10)
		if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))

	$scope.getGravatar = getGravatar = (email) ->
		'https://secure.gravatar.com/avatar/'+hex_md5(email)+'?d=' + BASE_URL + 'assets/img/default-avatar.jpg'

	Namespace('Materia.MyWidgets').SelectedWidget =
		init						: init,
		setSelectedWidget			: setSelectedWidget,
		noAccess					: noAccess,
		populateAvailability		: populateAvailability,
		populateDisplay				: populateDisplay,

		populateAttempts			: populateAttempts
		getCurrentSemester			: getCurrentSemester
		# $scope.setScoreView				: $scope.setScoreView
		toggleTableSort				: toggleTableSort
		showAllScores				: showAllScores
		toggleShareWidgetContainer	: toggleShareWidgetContainer

MyWidgets.controller 'ScoreReportingController', ($scope) ->
	console.log 'stuff'

MyWidgets.controller 'CollaborationController', ($scope) ->
	$scope.search = (nameOrFragment) ->
		$scope.searching = true

		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		if(nameOrFragment.length < 1)
			stopSpin()
			return
		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->
			if(matches == null || typeof matches == 'undefined' || matches.length < 1)
				$scope.searchResults = []
				stopSpin()
				return

			for user in matches
				user.gravatar = $scope.$parent.getGravatar(user.email)
			$scope.searchResults = matches
			$scope.$apply()

	$scope.searchMatchClick = (user) ->
		$scope.searching = false

		# Do not add duplicates
		for existing_user in $scope.$parent.collaborators
			if user.id == existing_user.id
				return

		$scope.$parent.collaborators.push
			id: user.id
			isCurrentUser: user.isCurrentUser
			expires: null
			expiresText: "Never"
			first: user.first
			last: user.last
			gravatar: user.gravatar
			access: 0

		setTimeout ->
			$scope.$parent.setupPickers()
		, 1

	$scope.removeAccess = (user) ->
		user.remove = true

	$scope.updatePermissions = (users) ->
		permObj = []

		for user in users
			# Do not allow saving if a demotion dialog is on the screen
			if user.warning
				return

			access = []
			for i in [0...user.access]
				access.push null

			access.push if user.remove then false else true

			permObj.push
				user_id: user.id
				expiration: user.expires
				perms: access

		Materia.Coms.Json.send 'permissions_set', [0,$scope.$parent.selectedWidget.id,permObj], (returnData) ->
			if returnData == true
				$scope.$parent.showCollaborationModal = false
			else
				alert(returnData.msg)
			$scope.$apply()

	$scope.checkForWarning = (user) ->
		if user.isCurrentUser and user.access < 30
			user.warning = true

	$scope.cancelDemote = (user) ->
		user.warning = false
		user.access = 30

