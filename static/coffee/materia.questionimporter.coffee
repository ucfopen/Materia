Namespace('Materia').QuestionImporter = do ->
	$selectedAssets = []
	$table = null

	init = (gateway) ->

		$(document).ready ->
			_setupTable()
			_loadAllQuestions()

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

		# when the url has changes, reload the questions
		$(window).bind 'hashchange', _loadAllQuestions

		# on resize, re-fit the table size
		$(window).resize ->
			$('div.dataTables_scrollBody').height $(window).height() - 150
			$table.fnAdjustColumnSizing()

		# setup the table
		$table = $('#question-table').dataTable
			bPaginate: false, # don't paginate
			bLengthChange: true, # resize the fields
			bAutoWidth: true,
			bProcessing: true, # show processing dialog
			sScrollY: '500px',  # setup to be a scrollable table
			oLanguage:
				sSearch : '',
				sInfoFiltered: ' / _MAX_',
				sInfo: 'showing: _TOTAL_'
			# columsn to display
			aoColumns: [
				{ mDataProp: 'text' },
				{ mDataProp: 'type' },
				{ mDataProp: 'created_at' },
				{ mDataProp: 'uses' }
			]
			# special sorting options
			aaSorting: [[2, 'desc']]
			# item renderers
			aoColumnDefs: [
					# date render
					fnRender: ( oObj, sVal ) ->
						d = new Date sVal*1000
						return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()
					aTargets: [ 2 ]
				,
					# select box
					fnRender: ( oObj, sVal ) ->
						return '<input type="checkbox" name="id" value="'+oObj.aData['id']+'" > <span class="q">'+sVal+'</span>'
					aTargets: [ 0 ]
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
				window.opener.Materia.Creator.onQuestionImportComplete(JSON.stringify(result))

	_getType = ->
		l = document.location.href
		type = l.substring(l.lastIndexOf('=')+1)
		type

	init:init