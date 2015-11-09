app = angular.module 'materia'
app.controller 'mediaImportCtrl', ($scope, $sce, $timeout, $window, $document) ->
	selectedAssets = []
	data = []
	imageAssetIndices = []
	audioAssetIndices = []
	videoAssetIndices = []
	dt = null
	uploading = false
	creator = null
	_coms = null
	$scope.imageAndAudioImport = true
	$scope.videoImport = false
	$scope.invalidTitle = false
	$scope.invalidLink = false
	$scope.extensions = ['jpg', 'jpeg', 'gif', 'png']
	$scope.permittedMediaTypes = "Image"
	$scope.fileType =
		fileTypeText: 'What type of file would you like to upload?'
		chosenType: 'Image'
		choices: [
			{
				id: 1
				text: 'Audio'
				show: true
				isUserAnswer: 'false'
			}
			{
				id: 2
				text: 'Video'
				show: true
				isUserAnswer: 'false'
			}
			{
				id: 3
				text: 'Image'
				show: true
				isUserAnswer: 'true'
			}
		]
	$scope.videoTitle = ''
	$scope.videoURL = ''
	$scope.cols = ['Title','Type','Date'] # the column names used for sorting datatable
	
	# this column data is passed to view to automate table header creation, 
	# without which datatables will fail to function
	$scope.dt_cols = [#columns expected from result, index 0-5
		{ "data": "id" },
		{ "data": "wholeObj" }, # stores copy of whole object as column for ui purposes
		{ "data": "title" },
		{ "data": "type" },
		{ "data": "file_size" },
		{ "data": "created_at" }
	]

	$scope.setChosenType = (text) ->
		$scope.fileType.chosenType = text
		$scope.changeImportMethod();

	$scope.changeImportMethod = ->
		$scope.videoImport = false
		$scope.imageAndAudioImport = false
		switch $scope.fileType.chosenType
			when 'Audio'
				$scope.imageAndAudioImport = true
				$scope.extensions = ['mp3']
				loadAllMedia()
				init(false)
			when 'Video'
				$scope.videoImport = true
				$scope.extensions = ['link']
				loadAllMedia()
				init(false)
			else
				$scope.imageAndAudioImport = true
				$scope.extensions = ['jpg', 'jpeg', 'gif', 'png']
				loadAllMedia()
				init(false)

	$scope.submitVideoLink = (title, link) ->
		$scope.videoTitle = title
		$scope.videoURL = link
		console.log $scope.videoTitle
		console.log $scope.videoURL
		#$scope.videoTitle = $sanitize(title)
		#$scope.videoURL = $sanitize(link)
		if $scope.videoURL and $scope.videoURL.indexOf("https://youtu.be/") is 0
			$scope.invalidLink = false
		else
			$scope.invalidLink = true
			$scope.videoURL = ''

		if $scope.videoTitle.length > 0
			$scope.invalidTitle = false
		else
			$scope.invalidTitle = true
			$scope.videoTitle = ''

		#if $scope.invalidLink == false && $scope.invalidTitle == false
			#upload the video link.

	# determine the types from the url hash string
	loadMediaTypes = ->
		mediaTypes = getHash()
		if mediaTypes
			$scope.permittedMediaTypes = mediaTypes.split(',')
		if $scope.permittedMediaTypes.indexOf("Audio") is -1
			$scope.fileType.choices[0].show = false
		if $scope.permittedMediaTypes.indexOf("Video") is -1
			$scope.fileType.choices[1].show = false
		if $scope.permittedMediaTypes.indexOf("Image") is -1
			$scope.fileType.choices[2].show = false

	# load up the media objects, optionally pass file id to skip labeling that file
	loadAllMedia = (file_id) ->
		# clear the table
		selectedAssets = []
		assetIndices = []
		data = []
		imageAssetIndices = []
		audioAssetIndices = []
		videoAssetIndices = []

		$('#question-table').dataTable().fnClearTable()
		loadMediaTypes()

		# load and/or select file for labelling
		_coms.send 'assets_get', [], (result) ->
			if result and result.msg is undefined and result.length > 0

				data = result

				$('#question-table').dataTable().fnClearTable()
				# augment result for custom datatables ui
				for res, index in result
					temp = {}
					if res.type in $scope.extensions
						# file uploaded - if this result's id matches, stop processing and select this asset now
						if file_id? and res.id == file_id and res.type in $scope.extensions
								$window.parent.Materia.Creator.onMediaImportComplete([res])

						# make entire object (barring id) an attr to use as column in datatables
						for own attr of res
							if attr!="id"
								temp[attr]=res[attr]
						res['wholeObj'] = temp
						#Store data table index in asset-specific array for use when user clicks asset in GUI
						if(res.type == 'link')
							videoAssetIndices.push(index)
						else if(res.type == 'mp3')
							audioAssetIndices.push(index)
						else
							imageAssetIndices.push(index)

						$('#question-table').dataTable().fnAddData(res)

	getHash = ->
		$window.location.hash.substring(1)


	# init
	init = (firstTime = true) ->
		upl = $("#uploader")
		upl.pluploadQueue
			# General settings
			runtimes : 'html5,flash,html4'
			url : '/media/upload/'
			max_file_size : '60mb'
			chunk_size : '2mb'
			unique_names : false
			rename : true
			multiple_queues: false
			
			# Specify what files to browse for
			filters : [
				title : "Media files"
				extensions : $scope.extensions.join()
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
					##########################################################
					# Break away for video links to avoid actual file upload,#
					# storing only title, type, and URL in the database.     #
					# if url:                                                #
					#	something else                                       #
					# else:                                                  #
					#	up.start()                                           #
					##########################################################
					up.start()
					# render import form unclickable during upload
					$('#import-form').css {
						"pointer-events": "none"
						opacity: "0.2"
					}
				# fired when the above is successful
				FileUploaded: (up, file, response) ->
					res = $.parseJSON response.response #parse response string
					# reload media to select newly uploaded file
					loadAllMedia res.id
					# returns clickability to import form after pload complete
					$('#import-form').css {
						"pointer-events": "auto"
						opacity: "1"
					}
					loadAllMedia()
				Error: (up, args) ->
					# Called when a error has occured

		$("#uploader_browse", upl)
			.text('Browse...')
			.next().remove() # removes the adjacent "Start upload" button
		$(".plupload_droptext", upl).text("Drag a file here to upload")

		$($document).on 'click', '#question-table tbody tr[role=row]', (e) ->
			#get index of row in datatable and call onMediaImportComplete to exit
			$(".row_selected").toggleClass('row_selected')
			index = $('#question-table').dataTable().fnGetPosition(this)
			#translates GUI's index of asset chosen to that of data table index
			if($scope.fileType.chosenType == 'Video')
				selectedAssets = [data[videoAssetIndices[index]]]
			else if($scope.fileType.chosenType == 'Audio')
				selectedAssets = [data[audioAssetIndices[index]]]
			else
				selectedAssets = [data[imageAssetIndices[index]]]
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

		if firstTime is true
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
							else if full.type is 'link'
								return '<img src="/assets/img/video.png">'
							else
								return ''
						searchable: false,
						sortable: true,
						targets: 0
					},
					{# custom ui column containing a nested table of asset details
						render: (data, type, full, meta) ->

							if data != undefined && full.type in $scope.extensions
								sub_table=document.createElement "table"
								sub_table.width="100%"
								sub_table.className="sub-table"

								row = sub_table.insertRow()
								cell = row.insertCell()

								temp = document.createElement "div"
								temp.className = "subtable-title"
								temp.innerHTML = data.title.split('.')[0]
								cell.appendChild temp

								temp=document.createElement "div"
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
	