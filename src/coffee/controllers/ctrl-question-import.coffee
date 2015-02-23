app = angular.module 'materia'
app.controller 'questionImporterCtrl', ($scope, $sce) ->
	$selectedAssets = []
	$table = null

	_setupTable = ->
		# listener for selecting a question row
		$(document).on 'click', '#question-table tbody tr', (e) ->
			$checkbox = $(this).find ':checkbox'
			$selected = $(this).toggleClass('row_selected').hasClass 'row_selected'
			$checkbox.prop 'checked', $selected  # update checkbox

			# stop the bubbling to prevent the row's click event
			e.stopPropagation() if e.target.type == 'checkbox'

			# add or remove the item from the selected ids
			if $selected
				$selectedAssets.push $checkbox.prop('value')
			else
				$selectedAssets.splice  $selectedAssets.indexOf( $checkbox.prop('value') ), 1

		$('#submit-button').click (e) ->
			e.stopPropagation()
			_loadSelectedQuestions $selectedAssets
			return false

		$('#cancel-button').click (e) ->
			e.stopPropagation()
			window.parent.Materia.Creator.onQuestionImportComplete(null)

		# when the url has changes, reload the questions
		$(window).bind 'hashchange', _loadAllQuestions

		# on resize, re-fit the table size
		$(window).resize ->
			$('div.dataTables_scrollBody').height $(window).height() - 150
			$table.fnAdjustColumnSizing()

		# setup the table
		$table = $('#question-table').dataTable
			paginate: false, # don't paginate
			lengthChange: true, # resize the fields
			autoWidth: true,
			processing: true, # show processing dialog
			scrollY: '500px',  # setup to be a scrollable table
			language:
				search : '',
				infoFiltered: ' / _MAX_',
				info: 'showing: _TOTAL_'
			# columsn to display
			columns: [
				{ data: 'text' },
				{ data: 'type' },
				{ data: 'created_at' },
				{ data: 'uses' }
			]
			# special sorting options
			sorting: [[2, 'desc']]
			# item renderers
			columnDefs: [
					# date render
					render: ( data, type, full, meta ) ->
						d = new Date data*1000
						(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()
					targets: 2
				,
					# select box
					render: ( data, type, full, meta  ) ->
						'<input type="checkbox" name="id" value="'+full.id+'" > <span class="q">'+data+'</span>'
					targets: 0
			]

		# re-fit the table now
		$('div.dataTables_scrollBody').height $(window).height()-150

	_loadAllQuestions = ->
		$selectedAssets = []
		$('#question-table').dataTable().fnClearTable() # clear the table
		# determine the types from the url hash string
		questionTypes = _getType()
		# load
		_getQuestions null, questionTypes, (result) ->
			# to prevent error messages when result is null
			if result != null && !('msg' in result) && result.length > 0
				$('#question-table').dataTable().fnClearTable()
				$('#question-table').dataTable().fnAddData(result)

	_getQuestions = (questionIds, questionTypes, callback) ->
		Materia.Coms.Json.send 'questions_get', [questionIds, questionTypes], callback

	_loadSelectedQuestions = (questionIds) ->
		_getQuestions questionIds, null, (result) ->
			if result? and 'msg' not of result and result.length > 0
				window.parent.Materia.Creator.onQuestionImportComplete(JSON.stringify(result))

	_getType = ->
		l = document.location.href
		type = l.substring(l.lastIndexOf('=')+1)
		type

	_setupTable()
	_loadAllQuestions()

