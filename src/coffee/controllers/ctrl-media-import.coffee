app = angular.module 'materia'
app.controller 'mediaImportCtrl', ($scope, $sce) ->
	selectedAssets = []
	data = []
	dt = null
	uploading = false
	creator = null
	_coms = null

	# load up the media objects
	loadAllMedia = ->
		# clear the table
		selectedAssets = []
		data = []

		$('#question-table').dataTable().fnClearTable()
		# determine the types from the url hash string
		mediaTypes = getHash()
		if mediaTypes
			mediaTypes = mediaTypes.split(',')

		# load
		_coms.send 'assets_get', [], (result) ->
			if result and result.msg is undefined and result.length > 0
				data = result
				$('#question-table').dataTable().fnClearTable()
				$('#question-table').dataTable().fnAddData(result)



	getHash = ->
		window.location.hash.substring(1)

	# init
	$(document).ready ->
		# click listener for each row
		$(document).on 'click', '#question-table tbody tr', (e) ->
			$(".row_selected").toggleClass('row_selected')

			radio = $(this).find(':radio')
			radio.attr('checked', true)

			selected = $(this).toggleClass('row_selected').hasClass('row_selected')

			# stop the bubbling to prevent the row's click event
			if e.target.type == "radio"
				e.stopPropagation()

			index = $('#question-table').dataTable().fnGetPosition(this)

			selectedAssets = [data[index]]

		$('#submit-button').click (e) ->
			e.stopPropagation()
			window.parent.Materia.Creator.onMediaImportComplete(selectedAssets)
			false

		$('#cancel-button').click (e) ->
			e.stopPropagation()
			window.parent.Materia.Creator.onMediaImportComplete(null)

		# on resize, re-fit the table size
		$(window).resize ->
			$('div.dataTables_scrollBody').height($(window).height() - 150)
			dt.fnAdjustColumnSizing()

		# setup the table
		dt = $('#question-table').dataTable {
			"paginate": false, # don't paginate
			"lengthChange": true, # resize the fields
			"autoWidth": false, #
			"processing": true, # show processing dialog
			"scrollY": "300px",  # setup to be a scrollable table
			"language": {
				"search" : '',
				"infoFiltered": ' / _MAX_',
				"info": "showing: _TOTAL_"
			}, # hide search label
			# columsn to display
			"columns": [
				{ "data": null  }, # radio button
				{ "data": "id" },
				{ "data": "title" },
				{ "data": "type" },
				{ "data": "file_size" },
				{ "data": "created_at" }
			],
			# special sorting options
			"sorting": [[5, "desc"]],
			# item renderers
			"columnDefs": [
				{
					# date column
					"render": (data, type, full, meta) ->
						d = new Date(data * 1000)
						return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()
					"targets": 5
				},
				{
					# file size column
					"render": (data, type, full, meta) ->
						return '<span class="numeric">'+Math.round(data/1024)+' kb</span>'
					"targets": 4
				},
				{
					# thumbnail column
					"render": (data, type, full, meta) ->
						return '<img src="/media/'+data+'/thumbnail">'
					"searchable": false,
					"sortable": false,
					"targets": 1
				},
				{
					# radio column
					"render": (data, type, full, meta) ->
						return '<input type="radio" name="id" />'
					"searchable": false,
					"sortable": false,
					"targets": 0
				}
			]
		}
		
		# # re-fit the table now
		$('div.dataTables_scrollBody').height($(window).height() - 150)

		_coms = Materia.Coms.Json
		_coms.setGateway(API_LINK)
		# load the questions
		loadAllMedia()

	# Show/Hide the Plupload dialog
	window.toggleUploader = ->
		state = $('#upload-cancel-button').text()

		if state == 'Close'
			$('#upload-cancel-button').text('Upload...')
			$('#modal-cover').fadeOut()
		else
			$('#upload-cancel-button').text('Close')
			$("#uploader").pluploadQueue
				# General settings
				runtimes : 'html5,flash,html4'
				url : '/media/upload/'
				max_file_size : '60mb'
				chunk_size : '2mb'
				unique_names : false
				rename : true
				multiple_queues: true
				
				# Specify what files to browse for
				filters : [
					title : "Media files"
					extensions : "jpeg,jpg,gif,png,flv,mp3"
				],

				# Flash settings
				flash_swf_url : '/assets/swf/plupload.flash.swf',

				init:
					StateChanged: (up) ->
						uploading = (up.state == plupload.STARTED)

						if (uploading)
							document.title = 'Uploading...'
						else
							document.title = 'Media Catalog | Materia'
							toggleUploader()
							loadAllMedia()
					Error: (up, args) ->
						# Called when a error has occured

			$('#modal-cover').fadeIn()
		$('#uploader-form').slideToggle()

	# Client side form validation
	$('#uploader-form').submit (e) ->
		e.preventDefault()
		uploader = $('#uploader').pluploadQueue()

		# Files in queue upload them first
		if uploader.files.length > 0
			# When all files are uploaded submit form
			uploader.bind 'StateChanged', ->
				if uploader.files.length == (uploader.total.uploaded + uploader.total.failed)
					$('form')[0].submit()

			uploader.start()
		else
			alert('You must queue at least one file.')

		false

