app = angular.module 'materia'
app.controller 'createCtrl', ['$scope', '$sce', ($scope, $sce) ->
	_creator       = null
	_embedDoneDfd  = null
	_embedTarget   = null
	_heartbeat     = null
	_importerPopup = null
	_inst_id       = null
	_instance      = null
	_keepQSet      = null
	_saveMode      = false
	_type          = null
	_widget_id     = null
	_widget_info   = null
	_widgetType    = null

	$scope.saveText = "Save Draft"
	$scope.previewText = "Preview"

	# get the _instance_id from the url if needed
	_inst_id = window.location.hash.substr(1) if window.location.hash
	_widget_id = window.location.href.match(/widgets\/([\d]+)/)[1]

	Namespace("Materia").Creator =
		# Exposed to the question importer screen
		onQuestionImportComplete: (questions) ->
			_hideEmbedDialog()
			return if !questions
			# assumes questions is already a JSON string
			questions = JSON.parse questions
			_sendToCreator 'onQuestionImportComplete', [questions]

		# Exposed to the media importer screen
		onMediaImportComplete: (media) ->
			_hideEmbedDialog()

			# convert the sparce array that was converted into an object back to an array (ie9, you SUCK)
			anArray = []
			for element in media
				anArray.push element
			_sendToCreator 'onMediaImportComplete', [anArray]

		init: (container, widget_id, inst_id) ->

	# If Initialization Fails
	_onInitFail = (msg) ->
		_stopHeartBeat()
		alert "Failure: #{msg}" if msg.toLowerCase() != 'flash player required.'

	# Every 30 seconds, renew/check the session
	_startHeartBeat = ->
		dfd = $.Deferred().resolve()
		_heartbeat = setInterval ->
			Materia.Coms.Json.send 'session_valid', [null, false], (data) ->
				if data == false
					alert 'You have been logged out due to inactivity.\n\nPlease login again.'
					window.location.reload()
		,30000

		dfd.promise()

	_stopHeartBeat = ->
		clearInterval _heartbeat

	# Gets widget info when not editing an existing instance
	_getWidgetInfo = ->
		dfd = $.Deferred()
		Materia.Coms.Json.send 'widgets_get', [[_widget_id]], (widgets) ->
			_widget_info = widgets[0]
			dfd.resolve()

		dfd.promise()

	# Gets instance and widget info when editing existing instance
	_getWidgetInstance = ->
		dfd = $.Deferred()
		Materia.Coms.Json.send 'widget_instances_get', [[_inst_id]], (widgetInstances) ->
			_instance    = widgetInstances[0]
			_widget_info = _instance.widget
			dfd.resolve()

		dfd.promise()

	# Gets the qset of a loaded instance
	_getQset = ->
		dfd = $.Deferred()
		Materia.Coms.Json.send 'question_set_get', [_inst_id], (data) ->
			_keepQSet = data
			dfd.resolve()

		dfd.promise()

	# Starts the Creator, sending required widget data
	_initCreator = ->
		dfd = $.Deferred().resolve()
		if _inst_id?
			_sendToCreator 'initExistingWidget', [_instance.name, _instance.widget, _keepQSet.data, _keepQSet.version, BASE_URL]
		else
			_sendToCreator 'initNewWidget', [_widget_info, BASE_URL]
		dfd.promise()

	# Send messages to the creator, handles flash and html creators
	_sendToCreator = (type, args) ->
		switch _widgetType
			when '.swf'
				_creator[type].apply _creator, args
			when '.html'
				_creator.contentWindow.postMessage(JSON.stringify({type:type, data:args}), STATIC_CROSSDOMAIN)

	# send a save request to the creator
	$scope.requestSave = (mode) ->
		# hide dialogs
		$scope.popup = ""
		console.log mode

		_saveMode = mode
		switch _saveMode
			when 'publish'
				$scope.previewText = "Saving..."
			when 'save'
				$scope.saveText = "Saving..."

		_sendToCreator 'onRequestSave', [mode]

	# Reusable fade animation for the save button text
	_fadeSaveButton = ($button, label, finalLabel) ->
		$button.fadeOut ->
			$button.html label
			$button.fadeIn ->
				window.setTimeout ->
					$button.fadeOut ->
						$button.html finalLabel
						$button.fadeIn()
				,5000

	# Popup a question importer dialog
	$scope.showQuestionImporter = ->
		# must be loose comparison
		types = _widget_info.meta_data.supported_data
		#the value passed on needs to be a list of one or two elements, i.e.
		#?type=QA or ?type=MC or ?type=QA,MC
		_showEmbedDialog '/questions/import/?type='+encodeURIComponent(types.join())
		null # else Safari will give the .swf data that it can't handle

	# build a my-widgets url to a specific widget
	_getMyWidgetsUrl = (inst_id) ->
		"#{BASE_URL}my-widgets##{inst_id}"

	# Embeds the creator
	_embed = ->
		dfd = $.Deferred()
		_widgetType = _widget_info.creator.slice _widget_info.creator.lastIndexOf('.')

		# allow creator paths to be absolute urls
		if (_widget_info.creator.substring(0,4) == 'http')
			creatorPath = _widget_info.creator
		# link to the static widget
		else
			creatorPath = WIDGET_URL+_widget_info.dir+_widget_info.creator

		_type = creatorPath.split('.').pop()
		$scope.type = _type

		switch _type
			when 'html'
				_embedHTML creatorPath, dfd
			when 'swf'
				_embedFlash creatorPath, _widget_info.flash_version, dfd

		# Prevent closing accidentally
		$(window).bind 'beforeunload', ->
			_importerPopup.close() if _importerPopup?

		dfd.promise()

	_embedHTML = (htmlPath, dfd) ->
		$scope.htmlPath = htmlPath
		$scope.$apply()
		_embedDoneDfd = dfd

		_onPostMessage = (e) ->
			origin = "#{e.origin}/"
			if origin == STATIC_CROSSDOMAIN or origin == BASE_URL
				msg = JSON.parse e.data
				switch msg.type
					when 'start' # The creator notifies us when its ready
						_onCreatorReady()
					when 'save' # The creator issued a save request
						_save msg.data[0], msg.data[1], msg.data[2] # instanceName, qset
					when 'cancelSave' # the creator canceled a save request
						_onSaveCanceled msg.data[0] # msg
					when 'showMediaImporter' # the creator wants to import media
						_showMediaImporter()
					when 'setHeight' # the height of the creator has changed
						_setHeight msg.data[0]
					when 'alert'
						_alert msg.data
					else
						alert "Unknown message from creator: #{msg.type}"
			else
				alert "Error, cross domain restricted for #{origin}"

		# setup the postmessage listener
		if addEventListener?
			addEventListener 'message', _onPostMessage, false
		else if attachEvent?
			attachEvent 'onmessage', _onPostMessage

	_embedFlash = (path, version, dfd) ->
		# register global callbacks for ExternalInterface calls
		window.__materia_flash_onCreatorReady = _onCreatorReady
		window.__materia_flash_importMedia    = _showMediaImporter
		window.__materia_flash_save           = _save
		window.__materia_flash_cancelSave     = _onSaveCanceled

		# store this dfd so that we can keep things synchronous
		# it will be resolved by the engine once it's loaded via onCreatorReady
		_embedDoneDfd = dfd
		if swfobject.hasFlashPlayerVersion('1') == false
			if $('#no_flash').length != 0
				$('#no_flash').css({'display': 'block'})
		else
			# setup variable to send to flash
			flashvars =
				URL_WEB: BASE_URL
				URL_GET_ASSET: "#{BASE_URL}media/"
				widget_id: _widget_id
				inst_id: _inst_id

			params =
				menu: 'false'
				allowFullScreen: 'true'
				AllowScriptAccess: 'always'

			attributes = {id: _embedTarget, wmode: 'opaque' }
			expressSwf = "#{BASE_URL}assets/flash/expressInstall.swf"
			width      = '100%'
			height     = '100%'

			# Needed to check for ie8 browsers to add a border to the swf object.
			if ie8Browser?
				width = '99.7%'
				height = '99.7%'

			swfobject.embedSWF path, _embedTarget, width, height, version, expressSwf, flashvars, params, attributes

	# Resizes the swf according to the window height
	_resizeCreator = ->
		$('.center').height $(window).height()-145
		# This fixes a bug in chrome where the iframe (#container)
		# doesn't correctly fill 100% of the height. Doing this with
		# just CSS doesn't work - it needs to be done in JS
		$('#container').css('position', 'relative')

	# Show the buttons that interact with the creator
	_showButtons = ->
		dfd = $.Deferred().resolve()
		# change the buttons if this isnt a draft
		if _instance && !_instance.is_draft
			$('#creatorPublishBtn').html 'Update'
			$('#creatorPreviewBtn').hide()
			$('#creatorSaveBtn').hide()
			$('#action-bar .dot').hide()
		_enableReturnLink()
		$('#action-bar').css 'visibility', 'visible'
		dfd.promise()

	# Changes the Return link's functionality depending on use
	_enableReturnLink = ->
		if _inst_id?
			# editing
			$scope.returnUrl = _getMyWidgetsUrl(_inst_id)
			$scope.returnPlace = "my widgets"
		else
			# new
			$scope.returnUrl = BASE_URL+'widgets'
			$scope.returnPlace = "widget catalog"
		$scope.$apply()

	$scope.onPublishPressed = ->
		if _inst_id? && _instance? && !_instance.is_draft
			# Show the Update Dialog
			$scope.popup = "update"
		else
			# Show the Publish Dialog
			$scope.popup = "publish"

	$scope.cancelPublish = (e, instant = false) ->
		$scope.popup = ""

	_onPreviewPopupBlocked = (url) ->
		$scope.popup = "blocked"
		$scope.previewUrl = url
		$scope.$apply()

	$scope.cancelPreview = (e, instant = false) ->
		$scope.popup = ""

	# When the creator says it's ready
	# Note this is psuedo public as it's exposed to flash
	_onCreatorReady = ->
		_creator = $('#container').get(0)
		# resize swf now and when window resizes
		$(window).resize _resizeCreator
		_resizeCreator()

		_embedDoneDfd.resolve() # used to keep events synchronous

	# Show an embedded dialog, as opposed to a popup
	_showEmbedDialog = (url) ->
		$scope.iframeUrl = url

	# move the embed dialog off to invisibility
	_hideEmbedDialog = ->
		$scope.iframeUrl = ""
		$scope.$apply()

	# Note this is psuedo public as it's exposed to flash
	_showMediaImporter = ->
		_showEmbedDialog '/media/import'
		$scope.$apply()
		null # else Safari will give the .swf data that it can't handle

	# save called by the widget creator
	# Note this is psuedo public as it's exposed to flash
	_save = (instanceName, qset, version = 1) ->
		Materia.Coms.Json.send(
			'widget_instance_save',
			[_widget_id, instanceName, {version:version, data:qset}, _saveMode != 'publish', _inst_id, null, null, null],
			(inst) ->
				if inst?
					# update this creator's url
					window.location.hash = '#'+inst.id if String(_inst_id).length != 0

					switch _saveMode
						when 'preview'
							url = "#{BASE_URL}preview/#{inst.id}"
							popup = window.open url
							if popup?
									setTimeout ->
										_onPreviewPopupBlocked(url) unless popup.innerHeight > 0
									,200
							else
								_onPreviewPopupBlocked(url)
						when 'publish'
							window.location = _getMyWidgetsUrl(inst.id)
						when 'save'
							$scope.saveText = "Saved!"
							_sendToCreator 'onSaveComplete', [inst.name, inst.widget, inst.qset.data, inst.qset.version]
							_inst_id  = inst.id
							_instance = inst
					$scope.$apply()
					setTimeout ->
						$scope.saveText = "Save Draft"
						$scope.$apply()
					, 5000
		)

	# When the Creator cancels a save request
	# Note this is psuedo public as it's exposed to flash
	_onSaveCanceled = (msg) ->
		$scope.saveText = "Can Not Save!"
		alert "Can not currently save. #{msg}" if msg

	_setHeight = (h) ->
		$('#container').height h

	_alert = (options) ->
		# TODO: Replace with a angular modal
		alert(options.msg)

	# synchronise the asynchronous events
	if _inst_id?
		$.when(_getWidgetInstance())
			.pipe(_embed)
			.pipe(_getQset)
			.pipe(_initCreator)
			.pipe(_showButtons)
			.pipe(_startHeartBeat)
			.fail(_onInitFail)
	else
		$.when(_getWidgetInfo())
			.pipe(_embed)
			.pipe(_initCreator)
			.pipe(_showButtons)
			.pipe(_startHeartBeat)
			.fail(_onInitFail)
]

