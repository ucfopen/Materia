const app = angular.module('materia')
app.controller('QuestionImporterCtrl', function ($scope, $sce) {
	let $selectedAssets = []
	let $table = null

	const _setupTable = () => {
		// listener for selecting a question row
		$(document).on('click', '#question-table tbody tr', (e) => {
			const $checkbox = $(e.currentTarget).find(':checkbox')
			const $selected = $(e.currentTarget).toggleClass('row_selected').hasClass('row_selected')
			$checkbox.prop('checked', $selected) // update checkbox

			// stop the bubbling to prevent the row's click event
			if (e.target.type === 'checkbox') {
				e.stopPropagation()
			}

			// add or remove the item from the selected ids
			if ($selected) {
				$selectedAssets.push($checkbox.prop('value'))
			} else {
				$selectedAssets.splice($selectedAssets.indexOf($checkbox.prop('value')), 1)
			}
		})

		$('#submit-button').click((e) => {
			e.stopPropagation()
			_loadSelectedQuestions($selectedAssets)
			return false
		})

		$('#cancel-button').click((e) => {
			e.stopPropagation()
			return window.parent.Materia.Creator.onQuestionImportComplete(null)
		})

		// when the url has changes, reload the questions
		$(window).bind('hashchange', _loadAllQuestions)

		// on resize, re-fit the table size
		$(window).resize(() => {
			$('div.dataTables_scrollBody').height($(window).height() - 150)
			$table.fnAdjustColumnSizing()
		})

		// setup the table
		$table = $('#question-table').dataTable({
			paginate: false, // don't paginate
			lengthChange: true, // resize the fields
			autoWidth: true,
			processing: true, // show processing dialog
			scrollY: '500px', // setup to be a scrollable table
			language: {
				search: '',
				infoFiltered: ' / _MAX_',
				info: 'showing: _TOTAL_',
			},
			// columsn to display
			columns: [{ data: 'text' }, { data: 'type' }, { data: 'created_at' }, { data: 'uses' }],
			// special sorting options
			sorting: [[2, 'desc']],
			// item renderers
			columnDefs: [
				{
					// date render
					render(data, type, full, meta) {
						const d = new Date(data * 1000)
						return d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
					},
					targets: 2,
				},
				{
					// select box
					render(data, type, full, meta) {
						return `<input type="checkbox" name="id" value="${full.id}" > <span class="q">${data}</span>`
					},
					targets: 0,
				},
			],
		})

		// re-fit the table now
		$('div.dataTables_scrollBody').height($(window).height() - 150)
	}

	const _loadAllQuestions = () => {
		$selectedAssets = []
		$('#question-table').dataTable().fnClearTable() // clear the table
		// determine the types from the url hash string
		const questionTypes = _getType()
		// load
		_getQuestions(null, questionTypes).then((result) => {
			// to prevent error messages when result is null
			if (result && result.length && result.length > 0) {
				$('#question-table').dataTable().fnClearTable()
				$('#question-table').dataTable().fnAddData(result)
			}
		})
	}

	const _getQuestions = (questionIds, questionTypes) => {
		return Materia.Coms.Json.send('questions_get', [questionIds, questionTypes])
	}

	const _loadSelectedQuestions = (questionIds) =>
		_getQuestions(questionIds).then((result) => {
			if (result != null && !('msg' in result) && result.length > 0) {
				window.parent.Materia.Creator.onQuestionImportComplete(JSON.stringify(result))
			}
		})

	const _getType = () => {
		const l = document.location.href
		const type = l.substring(l.lastIndexOf('=') + 1)
		return type
	}

	// expose to scope

	// Initialize
	_setupTable()
	_loadAllQuestions()
})
