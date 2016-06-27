app = angular.module 'materia'
app.controller 'mediaImportCtrl', ($scope, $sce, $timeout, $window, $document) ->
	selectedAssets = []
	data = []
	assetIndices = []
	dt = null
	uploading = false
	creator = null
	_coms = null
	$scope.fileType = location.hash.substring(1).split(',')
	$scope.cols = ['Title','Type','Date'] # the column names used for sorting datatable

	# this column data is passed to view to automate table header creation,
	# without which datatables will fail to function
	$scope.dt_cols = [#columns expected from result, index 0-5
		{ "data": "id"},
		{ "data": "wholeObj" }, # stores copy of whole whole object as column for ui purposes
		{ "data": "title" },
		{ "data": "type" },
		{ "data": "file_size" },
		{ "data": "created_at" }
	]

	# load up the media objects, optionally pass file id to skip labeling that file
	loadAllMedia = (file_id) ->
		# clear the table
		selectedAssets = []
		assetIndices = []
		data = []
		modResult = []

		$('#question-table').dataTable().fnClearTable()
		# determine the types from the url hash string
		mediaTypes = getHash()
		if mediaTypes
			mediaTypes = mediaTypes.split(',')

		# load and/or select file for labelling
		_coms.send 'assets_get', [], (result) ->
			if result and result.msg is undefined and result.length > 0
				data = result
				$('#question-table').dataTable().fnClearTable()
				# augment result for custom datatables ui
				for res, index in result
					if res.type in $scope.fileType
						# file uploaded - if this result's id matches, stop processing and select this asset now
						if file_id? and res.id == file_id and res.type in $scope.fileType
								$window.parent.Materia.Creator.onMediaImportComplete([res])

						# make entire object (barring id) an attr to use as column in datatables
						temp = {}
						for own attr of res
							if attr!="id"
								temp[attr]=res[attr]
						res['wholeObj'] = temp
						#Store data table index in asset-specific array for use when user clicks asset in GUI
						assetIndices.push(index)
						modResult.push(res)

				$('#question-table').dataTable().fnAddData(modResult)

	getHash = ->
		$window.location.hash.substring(1)

	# init
	init = ->
		upl = $("#uploader")
		upl.pluploadQueue
			# General settings
			runtimes : 'html5,html4'
			url : '/media/upload/'
			max_file_size : '60mb'
			chunk_size : '2mb'
			unique_names : false
			rename : true
			multiple_queues: false

			# Specify what files to browse for
			filters : [
				title : "Media files"
				extensions : $scope.fileType.join()
			]

			init:
				StateChanged: (up) ->
					uploading = (up.state == plupload.STARTED)

					if (uploading)
						document.title = 'Uploading...'
					else
						document.title = 'Media Catalog | Materia'
						loadAllMedia()
				# automatic upload on drop into queue
				FilesAdded: (up) ->
					up.start()
					# render import form unclickable during upload
					$('#import-form').css {
						"pointer-events": "none"
						opacity: "0.2"
					}
				# fired when the above is successful
				FileUploaded: (up, file, response) ->
					res = $.parseJSON response.response #parse response string
					if res.error
						up.removeFile file
						alert 'Error code '+res.error.code+': '+res.error.message
						$window.parent.Materia.Creator.onMediaImportComplete null
					else
						# reload media to select newly uploaded file
						loadAllMedia res.id
				Error: (up, args) ->
					# Called when a error has occured
					if args.code = -600 # http error
						up.removeFile args.file
						alert 'There was an unexpected error (500) - Try again later.'
						$window.parent.Materia.Creator.onMediaImportComplete null
						false

		$("#uploader_browse", upl)
			.text('Browse...')
			.next().remove() # removes the adjacent "Start upload" button
		$(".plupload_droptext", upl).text("Drag a file here to upload")

		$($document).on 'click', '#question-table tbody tr[role=row]', (e) ->
			#get index of row in datatable and call onMediaImportComplete to exit
			$(".row_selected").toggleClass('row_selected')
			index = $('#question-table').dataTable().fnGetPosition(this)
			#translates GUI's index of asset chosen to that of data table index
			selectedAssets = [data[assetIndices[index]]]
			$window.parent.Materia.Creator.onMediaImportComplete(selectedAssets)

		# todo: add cancel button
		$('#close-button').click (e) ->
			e.stopPropagation()
			$window.parent.Materia.Creator.onMediaImportComplete(null)

		# sorting buttons found in sort bar
		$('.dt-sorting').click (e) ->
			el = $(this).next() #get neighbor
			if el.hasClass('sort-asc') || el.hasClass('sort-desc')
				el.toggleClass "sort-asc sort-desc"
			else
				el.addClass "sort-asc"
				el.show()

		# on resize, re-fit the table size
		$($window).resize ->
			dt.fnAdjustColumnSizing()

		# setup the table
		dt = $('#question-table').dataTable {
			paginate: false # don't paginate
			lengthChange: true # resize the fields
			autoWidth: false #
			processing: true # show processing dialog
			scrollY: "inherit"  # setup to be a scrollable table
			language:
				search: '' # hide search label
				infoFiltered: ''
				info: ''
				infoEmpty: ''
			# columns to display
			columns: $scope.dt_cols #see global vars up top
			# special sorting options
			sorting: [[5, "desc"]] #sort by date by default
			# item renderers
			columnDefs: [
				{# thumbnail column
					render: (data, type, full, meta) ->
						if full.type is 'jpg' or full.type is 'jpeg' or full.type is 'png' or full.type is 'gif'
							return '<img src="/media/'+data+'/thumbnail">'
						else if full.type is 'mp3'
							return '<img src="/assets/img/audio.png">'
						else
							return ''
					searchable: false,
					sortable: true,
					targets: 0
				},
				{# custom ui column containing a nested table of asset details
					render: (data, type, full, meta) ->
						if full.type in $scope.fileType
							sub_table = document.createElement "table"
							sub_table.width = "100%"
							sub_table.className = "sub-table"

							row = sub_table.insertRow()
							cell = row.insertCell()

							temp = document.createElement "div"
							temp.className = "subtable-title"
							temp.innerHTML = data.title.split('.')[0]
							cell.appendChild temp

							temp = document.createElement "div"
							temp.className = "subtable-type subtable-gray"
							temp.innerHTML = data.type
							cell.appendChild temp

							cell = row.insertCell()
							cell.className = "subtable-date subtable-gray"
							d = new Date(data.created_at * 1000)
							cell.innerHTML = (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear()

							return sub_table.outerHTML
						else
							return ''
					searchable: false,
					sortable: false,
					targets: 1
				},
				{# remaining columns are searchable but hidden
					visible: false,
					sortable: true,
					targets: [2,3,4,5]
				}
			]
		}

		# add sort listeners to custom sort elements in sort-bar on view
		dt.fnSortListener $("#sort-#{col}"), (i+2) for col,i in $scope.cols

		# add id for custom styling
		$('#question-table_filter input').attr('id', 'search-box')

		_coms = Materia.Coms.Json
		_coms.setGateway(API_LINK)
		loadAllMedia()

	$timeout init
