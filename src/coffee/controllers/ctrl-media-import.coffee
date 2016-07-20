app = angular.module 'materia'

app.directive 'fileOnChange', ->
	return {
		restrict: 'A',
		link: (scope, element, attrs) ->
			onChangeHandler = scope.$eval(attrs.fileOnChange)
			element.bind 'change', onChangeHandler
	}

app.controller 'mediaImportCtrl', ($scope, $sce, $timeout, $window, $document) ->
	selectedAssets = []
	data = []
	assetIndices = []
	dt = null
	uploading = false
	creator = null
	_coms = null

	class Uploader
		allowedTypes: ['image/jpeg', 'image/png']

		# get the data of the image
		getImageData: (file, callback) ->
			dataReader = new FileReader

			dataReader.onload = (event) =>
				callback event.target.result, file.name

			dataReader.readAsDataURL file

		upload: (dataUrl, fileName, shouldVerifyImageUpload = true) ->
			mime = dataUrl.split(";")[0].split(":")[1]
			if @allowedTypes.indexOf(mime) == -1
				alert "Files of type #{mime} are not supported. Allowed Types: #{@allowedTypes.join(', ')}."
				return

			# @set { statusMsg:'Pre-upload'}
			_coms.send 'upload_keys_get', [], (keyData) =>
				@sendToS3 keyData, fileName, mime, dataUrl, shouldVerifyImageUpload

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

			# @set {statusMsg: 'Getting Keys', name: null}

		# ok, go ahead and send the file to s3
		sendToS3: (keyData, fileName, mime, dataUrl, shouldVerifyImageUpload) ->
			# @set 'statusMsg', 'Uploading'

			fd = new FormData()
			fd.append("key", keyData.fileURI)
			fd.append("Content-Type", mime)
			fd.append("acl", 'public-read')
			fd.append("success_action_status", '201')
			fd.append("AWSAccessKeyID", keyData.AWSAccessKeyId) # TODO: needed?
			fd.append("policy", keyData.policy)
			fd.append("signature", keyData.signature)
			fd.append("file", @dataURItoBlob(dataUrl, mime))


			request = new XMLHttpRequest()
			request.onload = (oEvent) =>
				if request.status = 200
					# response is xml! get the image url to save to our server
					p = new DOMParser()
					d = p.parseFromString(request.response, 'application/xml')
					url = d.getElementsByTagName('Location')[0].innerHTML
					@saveUploadedImageUrl fileName, url, shouldVerifyImageUpload

			request.open("POST", "http://localhost:4567")
			request.send(fd)

		saveUploadedImageUrl: (fileName, url, shouldVerifyImageUpload) ->
			_coms.send 'remote_asset_post', [fileName, url], (result) ->
				console.log 'id?', result

		verifyImageUpload: ->
			@set {statusMsg: 'Generating Thumbnails'}
			clearTimeout @pollTimeout
			@pollTimeout = setTimeout(@pollUploadedImage, 2000)

		# keep polling using a cheap HEAD request and an incrementing url (s3 caches the result otherwise)
		pollUploadedImage: =>
			Backbone.ajax
				url: @get('unverified_name')+"?attempt="+@pollCount
				type: 'HEAD'
				error: =>
					if @pollCount > 20
						alert 'Error Resizing Upload'
					else
						@pollCount++
						pollSpeed = (if @pollCount < 4 then 1500 else 5000) #increase poll time
						@pollTimeout = setTimeout(@pollUploadedImage, pollSpeed)
				success: =>
					@pollCount = 0
					@set {name: @get('unverified_name'), statusMsg: null}


		# when file is selected in browser
		onFileChange: (event) =>
			fileList = event.target.files
			# just picks the first selected image
			if fileList?[0]?
				imgData = @getImageData fileList[0], (src, imgName) =>
					@upload src, imgName

	uploader = new Uploader()

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
			console.log result
			if result and result.msg is undefined and result.length > 0
				data = result
				$('#question-table').dataTable().fnClearTable()
				# augment result for custom datatables ui
				for res, index in result
					console.log 'filetype', $scope.fileType, location
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
						console.log 'res', res
						#Store data table index in asset-specific array for use when user clicks asset in GUI
						assetIndices.push(index)
						modResult.push(res)
				console.log 'modres', modResult

				$('#question-table').dataTable().fnAddData(modResult)

	getHash = ->
		$window.location.hash.substring(1)

	# init
	init = ->
		# $('.upload-input').

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
