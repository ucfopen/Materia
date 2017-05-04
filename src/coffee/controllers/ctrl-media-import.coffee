app = angular.module 'materia'

app.directive 'fileOnChange', ->
	return {
		restrict: 'A',
		link: (scope, element, attrs) ->
			onChangeHandler = scope.$eval(attrs.fileOnChange)
			element.bind 'change', onChangeHandler
			element.bind 'drop', onChangeHandler
	}

app.controller 'mediaImportCtrl', ($scope, $sce, $timeout, $window, $document) ->
	selectedAssets  = []
	data            = []
	assetIndices    = []
	dt              = null
	uploading       = false
	creator         = null
	_coms           = null
	_s3enabled      = S3_ENABLED # explicitly localize globals
	_mediaUploadUrl = MEDIA_UPLOAD_URL
	_mediaUrl       = MEDIA_URL
	_baseUrl        = BASE_URL

	class Uploader
		constructor: (@config) ->

		# when file is selected in browser
		onFileChange: (event) =>
			#accounts for drag'n'drop
			fileList = event.target.files
			if !fileList?[0]?
				fileList = event.dataTransfer.files
			# just picks the first selected image
			if fileList?[0]?
				@getFileData fileList[0], (fileData) =>
					if fileData?

						# if s3 is enabled, get keys and then upload, o/w just upload
						if @config.s3enabled
							_coms.send 'upload_keys_get', [fileData.name, fileData.size], (keyData) =>
								@upload fileData, keyData if keyData
						else
							@upload fileData

		$dropArea = $('.drag-wrapper')

		$dropArea.on 'drag dragstart dragend dragover dragenter dragleave drop', (e)->
			e.preventDefault()
		.on 'dragover dragenter', ()->
			$dropArea.addClass 'drag-is-dragover'
		.on 'dragleave dragend drop', ()->
			$dropArea.removeClass 'drag-is-dragover'

		# get the data of the image
		getFileData: (file, callback) ->
			dataReader = new FileReader

			# File size is measured in bytes
			if file.size > 60000000
				alert "The file being uploaded has a size greater than 60MB. Please choose a file that
				is no greater than 60MB."
				return null

			dataReader.onload = (event) =>
				src = event.target.result
				mime = @getMimeType(src)
				return null if !mime?
				fileData =
					name: file.name
					mime: mime
					ext:  file.name.split('.').pop()
					size: file.size
					src:  src

				callback fileData

			dataReader.readAsDataURL file

		getMimeType: (dataUrl)->
			allowedTypes = ['image/jpeg', 'image/png']
			mime = dataUrl.split(";")[0].split(":")[1]
			if !mime? or allowedTypes.indexOf(mime) == -1
				alert "Unfortunately, the file type being uploaded is not supported.
				Please retry with one of the following types: #{allowedTypes.join(', ')}."
				return null
			return mime

		# converts image data uri to a blob for uploading
		dataURItoBlob: (dataURI, mime)  ->
			# convert base64/URLEncoded data component to raw binary data held in a string
			dataParts = dataURI.split(',')
			if dataParts[0].indexOf('base64') >= 0
				byteString = atob(dataParts[1])
			else
				byteString = unescape(dataParts[1])

			intArray = new Uint8Array(byteString.length)
			for i of byteString
				intArray[i] = byteString.charCodeAt(i)
			return new Blob([intArray], {type: mime})

		# upload to either local server or s3
		upload: (fileData, keyData) ->
			fd = new FormData()

			# for s3 uploading
			if keyData?
				fd.append("key", keyData.file_key)
				fd.append("acl", 'public-read')
				fd.append("Policy", keyData.policy)
				fd.append("Signature", keyData.signature)
				fd.append("AWSAccessKeyId", keyData.AWSAccessKeyId)
			else
				fd.append("name", fileData.name)

			fd.append("Content-Type", fileData.mime)
			fd.append("success_action_status", '201')
			fd.append("file", @dataURItoBlob(fileData.src, fileData.mime), fileData.name)

			request = new XMLHttpRequest()

			request.onload = (oEvent) =>
				if keyData? # s3 upload
					success = request.status == 200 or request.status == 201

					if(!success)
						# Parse the Error message received from amazonaws
						parser = new DOMParser()
						doc = parser.parseFromString(request.response, 'application/xml')
						upload_error = doc.getElementsByTagName("Error")[0].childNodes[1].innerHTML

						@saveUploadStatus fileData.ext, keyData.file_key, success, upload_error
						alert "There was an issue uploading this asset to Materia - Please try again later."
						return null
						
					@saveUploadStatus fileData.ext, keyData.file_key, success
				else # local upload
					res = JSON.parse request.response #parse response string
					if res.error
						alert 'Error code '+res.error.code+': '+res.error.message
						$window.parent.Materia.Creator.onMediaImportComplete null
					else
						# reload media to select newly uploaded file
						loadAllMedia res.id # todo: wait, but why? for file info?

			request.open("POST", @config.uploadUrl)
			request.send(fd)

		saveUploadStatus: (fileType, fileURI, s3_upload_success, error = null) ->
			re = /\-(\w{5})\./
			fileID = fileURI.match(re)[1] # id is in first capture group
			_coms.send 'upload_success_post', [fileID, s3_upload_success, error], (update_success) ->
				if s3_upload_success
					res =
						id: fileURI
						type: fileType
					$window.parent.Materia.Creator.onMediaImportComplete([res])

	config =
		s3enabled: _s3enabled
		uploadUrl: _mediaUploadUrl
	uploader = new Uploader(config)

	# SCOPE VARS
	# ==========
	$scope.fileType = location.hash.substring(1).split(',')
	$scope.cols = ['Title','Type','Date'] # the column names used for sorting datatable

	# this column data is passed to view to automate table header creation,
	# without which datatables will fail to function
	$scope.dt_cols = [#columns expected from result, index 0-5
		{ "data": "id"},
		{ "data": "wholeObj" }, # stores copy of whole whole object as column for ui purposes
		{ "data": "remote_url" },
		{ "data": "title" },
		{ "data": "type" },
		{ "data": "file_size" },
		{ "data": "created_at" }
	]

	$scope.uploadFile = uploader.onFileChange

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
					if res.remote_url? and res.status != "upload_success"
						continue;

					if res.type in $scope.fileType
						# the id used for asset url is actually remote_url
						# if it exists, use it instead
						res.id = res.remote_url ? res.id

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

				# Only add to table if there are items to add
				if modResult.length > 0
					$('#question-table').dataTable().fnAddData(modResult)

	getHash = ->
		$window.location.hash.substring(1)

	# init
	init = ->

		$(document).on 'click', '#question-table tbody tr[role=row]', (e) ->
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
		$(window).resize ->
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
							# todo: poll, since we don't know when lambda resizing is finished

							thumbUrl = "#{_mediaUrl}/"

							if _s3enabled
								original_path_data = data.split('/')

								# separates filename and extension
								image_key = original_path_data.pop().split(".")

								extension = image_key.pop()

								# Maintains a standard extension
								if(extension == 'jpg')
									extension = 'jpeg'

								# thumbnails in Materia never exceed 75x75 dimensions
								image_key.push('75x75'+'.'+extension)
								original_path_data.push(image_key.join('-'))

								# creates final thumbnail path
								thumbId = original_path_data.join("/")
								thumbUrl += "#{thumbId}"
							else
								thumbUrl += "#{data}/thumbnail"
							return "<img src='#{thumbUrl}'>"
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
