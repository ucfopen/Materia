app = angular.module 'materia'
app.controller 'createCtrl', ($scope, $sce, $timeout, widgetSrv, Alert) ->

	$scope.alert = Alert

	HEARTBEAT_INTERVAL = 30000
	# How far from the top of the window that the creator frame starts
	BOTTOM_OFFSET = 145
	# Where to embed flash
	EMBED_TARGET   = "container"

	creator       = null
	embedDoneDfd  = null
	heartbeat     = null
	importerPopup = null
	inst_id       = null
	instance      = null
	keepQSet      = null
	saveMode      = false
	type          = null
	widget_id     = null
	widget_info   = null
	widgetType    = null

	# get the instance_id from the url if needed
	inst_id = window.location.hash.substr(1) if window.location.hash
	widget_id = window.location.href.match(/widgets\/([\d]+)/)[1]

	# Model properties
	$scope.saveStatus = 'idle'
	$scope.saveText = "Save Draft"
	$scope.previewText = "Preview"
	$scope.publishText = "Publish..."

	$scope.invalid = false
	$scope.modal = false

	# Model methods
	# send a save request to the creator
	$scope.requestSave = (mode) ->
		# hide dialogs
		$scope.popup = ""

		saveMode = mode
		$scope.saveStatus = 'saving'
		switch saveMode
			when 'publish'
				$scope.previewText = "Saving..."
			when 'save'
				$scope.saveText = "Saving..."

		sendToCreator 'onRequestSave', [mode]

	# Popup a question importer dialog
	$scope.showQuestionImporter = ->
		# must be loose comparison
		types = widget_info.meta_data.supported_data
		#the value passed on needs to be a list of one or two elements, i.e.
		#?type=QA or ?type=MC or ?type=QA,MC
		showEmbedDialog '/questions/import/?type='+encodeURIComponent(types.join())
		null # else Safari will give the .swf data that it can't handle

	$scope.onPublishPressed = ->
		if inst_id? and instance? and !instance.is_draft
			# Show the Update Dialog
			$scope.popup = "update"
		else
			# Show the Publish Dialog
			$scope.popup = "publish"

	$scope.cancelPublish = (e, instant = false) ->
		$scope.popup = ""

	$scope.cancelPreview = (e, instant = false) ->
		$scope.popup = ""

	# If Initialization Fails
	onInitFail = (msg) ->
		stopHeartBeat()
		_alert "Failure: #{msg}" if msg.toLowerCase() != 'flash player required.'

	# Every 30 seconds, renew/check the session
	startHeartBeat = ->
		dfd = $.Deferred().resolve()
		heartbeat = setInterval ->
			Materia.Coms.Json.send 'session_author_verify', [null, false], (data) ->
				if data != true
					_alert 'You have been logged out due to inactivity', 'Invalid Login', true, true
					$scope.$apply()
					stopHeartBeat()
		, HEARTBEAT_INTERVAL

		dfd.promise()

	stopHeartBeat = ->
		clearInterval heartbeat

	# Gets widget info when not editing an existing instance
	getWidgetInfo = ->
		dfd = $.Deferred()
		widgetSrv.getWidgetInfo widget_id, (widgets) ->
			dfd.resolve widgets

		dfd.promise()

	# Gets the qset of a loaded instance
	getQset = ->
		dfd = $.Deferred()
		Materia.Coms.Json.send 'question_set_get', [inst_id], (data) ->
			if data?.title == "Permission Denied" or data.title == "error"
				$scope.invalid = true
				$scope.$apply()
			else
				keepQSet = data
			dfd.resolve()

		dfd.promise()

	# Starts the Creator, sending required widget data
	initCreator = ->
		dfd = $.Deferred().resolve()
		if inst_id?
			sendToCreator 'initExistingWidget', [instance.name, instance.widget, keepQSet.data, keepQSet.version, BASE_URL]
		else
			sendToCreator 'initNewWidget', [widget_info, BASE_URL]
		dfd.promise()

	# Send messages to the creator, handles flash and html creators
	sendToCreator = (type, args) ->
		switch widgetType
			when '.swf'
				creator[type].apply creator, args
			when '.html'
				creator.contentWindow.postMessage(JSON.stringify({type:type, data:args}), STATIC_CROSSDOMAIN)

	# build a my-widgets url to a specific widget
	getMyWidgetsUrl = (instid) ->
		"#{BASE_URL}my-widgets##{instid}"

	# Embeds the creator
	embed = (widgetData) ->
		if widgetData?[0].widget
			instance    = widgetData[0]
			widget_info = instance.widget
		else
			widget_info = widgetData[0]

		$scope.nonEditable = widget_info.is_editable == "0"

		dfd = $.Deferred()
		widgetType = widget_info.creator.slice widget_info.creator.lastIndexOf('.')

		# allow creator paths to be absolute urls
		if (widget_info.creator.substring(0,4) == 'http')
			creatorPath = widget_info.creator
		# link to the static widget
		else
			creatorPath = WIDGET_URL+widget_info.dir+widget_info.creator

		type = creatorPath.split('.').pop()
		$scope.loaded = true
		$scope.type = type
		$scope.$apply()

		switch type
			when 'html'
				embedHTML creatorPath, dfd
			when 'swf'
				embedFlash creatorPath, widget_info.flash_version, dfd

		# Prevent closing accidentally
		$(window).bind 'beforeunload', ->
			importerPopup.close() if importerPopup?

		dfd.promise()

	embedHTML = (htmlPath, dfd) ->
		$scope.htmlPath = htmlPath + "?" + widget_info.created_at
		$scope.$apply()
		embedDoneDfd = dfd

		onPostMessage = (e) ->
			origin = "#{e.origin}/"
			if origin == STATIC_CROSSDOMAIN or origin == BASE_URL
				msg = JSON.parse e.data
				switch msg.type
					when 'start' # The creator notifies us when its ready
						onCreatorReady()
					when 'save' # The creator issued a save request
						save msg.data[0], msg.data[1], msg.data[2] # instanceName, qset
					when 'cancelSave' # the creator canceled a save request
						onSaveCanceled msg.data[0] # msg
					when 'showMediaImporter' # the creator wants to import media
						showMediaImporter(msg.data)
					when 'setHeight' # the height of the creator has changed
						setHeight msg.data[0]
					when 'alert'
						_alert msg.data
					else
						_alert "Unknown message from creator: #{msg.type}"
			else
				_alert "Error, cross domain restricted for #{origin}"

		# setup the postmessage listener
		if addEventListener?
			addEventListener 'message', onPostMessage, false

	embedFlash = (path, version, dfd) ->
		# register global callbacks for ExternalInterface calls
		window.__materia_flash_onCreatorReady = onCreatorReady
		window.__materia_flash_importMedia    = showMediaImporter
		window.__materia_flash_save           = save
		window.__materia_flash_cancelSave     = onSaveCanceled

		# store this dfd so that we can keep things synchronous
		# it will be resolved by the engine once it's loaded via onCreatorReady
		embedDoneDfd = dfd
		if swfobject.hasFlashPlayerVersion('1') == false
			$scope.$apply -> $scope.type = "noflash"
		else
			# setup variable to send to flash
			flashvars =
				URL_WEB: BASE_URL
				URL_GET_ASSET: "#{BASE_URL}media/"
				widget_id: widget_id
				inst_id: inst_id

			params =
				menu: 'false'
				allowFullScreen: 'true'
				AllowScriptAccess: 'always'

			attributes = {id: EMBED_TARGET, wmode: 'opaque' }
			expressSwf = "#{BASE_URL}assets/flash/expressInstall.swf"
			width      = '100%'
			height     = '100%'

			# Needed to check for ie8 browsers to add a border to the swf object.
			if ie8Browser?
				width = '99.7%'
				height = '99.7%'

			swfobject.embedSWF path, EMBED_TARGET, width, height, version, expressSwf, flashvars, params, attributes

	# Resizes the swf according to the window height
	resizeCreator = ->
		$('.center').height $(window).height() - BOTTOM_OFFSET
		# This fixes a bug in chrome where the iframe (#container)
		# doesn't correctly fill 100% of the height. Doing this with
		# just CSS doesn't work - it needs to be done in JS
		$('#container').css('position', 'relative')

	# Show the buttons that interact with the creator
	showButtons = ->
		dfd = $.Deferred().resolve()
		# change the buttons if this isnt a draft
		if instance and !instance.is_draft
			$scope.publishText = "Update"
			$scope.updateMode = true
		enableReturnLink()
		$scope.showActionBar = true
		$scope.$apply()
		dfd.promise()

	# Changes the Return link's functionality depending on use
	enableReturnLink = ->
		if inst_id?
			# editing
			$scope.returnUrl = getMyWidgetsUrl(inst_id)
			$scope.returnPlace = "my widgets"
		else
			# new
			$scope.returnUrl = BASE_URL+'widgets'
			$scope.returnPlace = "widget catalog"
		$scope.$apply()

	onPreviewPopupBlocked = (url) ->
		$scope.popup = "blocked"
		$scope.previewUrl = url
		$scope.$apply()

	# When the creator says it's ready
	# Note this is psuedo public as it's exposed to flash
	onCreatorReady = ->
		creator = $('#container').get(0)
		# resize swf now and when window resizes
		$(window).resize resizeCreator
		resizeCreator()

		embedDoneDfd.resolve() # used to keep events synchronous

	# Show an embedded dialog, as opposed to a popup
	showEmbedDialog = (url) ->
		$scope.iframeUrl = url

	# move the embed dialog off to invisibility
	hideEmbedDialog = ->
		$scope.iframeUrl = ""
		$scope.modal = false
		setTimeout (->
			$scope.$apply()
			return
		), 0

	# Note this is psuedo public as it's exposed to flash
	showMediaImporter = (types) ->
		showEmbedDialog '/media/import#' + types.join(',')
		$scope.modal = true
		setTimeout (->
			$scope.$apply()
			return
		), 0
		null # else Safari will give the .swf data that it can't handle

	# save called by the widget creator
	# Note this is psuedo public as it's exposed to flash
	save = (instanceName, qset, version = 1) ->
		widgetSrv.saveWidget
			widget_id: widget_id,
			name: instanceName,
			qset: {version:version, data:qset},
			is_draft: saveMode != 'publish',
			inst_id: inst_id
			, (inst) ->
				# did we get back an error message?
				if inst?.msg?
					onSaveCanceled inst
					$scope.alert.fatal = inst.halt
					$scope.$apply()
				else if inst? and inst.id?
					# update this creator's url
					window.location.hash = '#'+inst.id if String(inst_id).length != 0

					switch saveMode
						when 'preview'
							url = "#{BASE_URL}preview/#{inst.id}"
							popup = window.open url
							inst_id  = inst.id
							if popup?
								$timeout ->
									onPreviewPopupBlocked(url) unless popup.innerHeight > 0
								, 200
							else
								onPreviewPopupBlocked(url)
						when 'publish'
							window.location = getMyWidgetsUrl(inst.id)
						when 'save'
							$scope.saveText = "Saved!"
							sendToCreator 'onSaveComplete', [inst.name, inst.widget, inst.qset.data, inst.qset.version]
							inst_id  = inst.id
							instance = inst
							$scope.saveStatus = 'saved'

					$scope.$apply()
					setTimeout ->
						$scope.saveText = "Save Draft"
						$scope.saveStatus = 'idle'
						$scope.$apply()
					, 5000

	# When the Creator cancels a save request
	# Note this is psuedo public as it's exposed to flash
	onSaveCanceled = (msg) ->
		$scope.saveText = "Can Not Save!"

		if msg?.msg?
			if msg.halt?
				_alert "Unfortunately, your progress was not saved because
				#{msg.msg.toLowerCase()}. Any unsaved progress will be lost.", "Invalid Login", true, true
				stopHeartBeat()
		else
			if msg then _alert "Unfortunately your progress was not saved because
			#{msg.toLowerCase()}", 'Hold on a sec', false, false

	setHeight = (h) ->
		$('#container').height h

	_alert = (msg, title= null, fatal = false, enableLoginButton = false) ->
		$scope.$apply ->
			$scope.alert.msg = msg
			$scope.alert.title = title if title isnt null
			$scope.alert.fatal = fatal
			$scope.alert.enableLoginButton = enableLoginButton

	# Exposed to the window object so that popups and frames can use this public functions
	Namespace("Materia").Creator =
		# Exposed to the question importer screen
		onQuestionImportComplete: (questions) ->
			hideEmbedDialog()
			return if !questions
			# assumes questions is already a JSON string
			questions = JSON.parse questions
			sendToCreator 'onQuestionImportComplete', [questions]

		# Exposed to the media importer screen
		onMediaImportComplete: (media) ->
			hideEmbedDialog()

			if media != null
				# convert the sparce array that was converted into an object back to an array (ie9, you SUCK)
				anArray = []
				for element in media
					anArray.push element
				sendToCreator 'onMediaImportComplete', [anArray]


	# synchronise the asynchronous events
	if inst_id?
		getQset().then ->
			if !$scope.invalid
				$.when(widgetSrv.getWidget(inst_id))
					.pipe(embed)
					.pipe(initCreator)
					.pipe(showButtons)
					.pipe(startHeartBeat)
					.fail(onInitFail)
	else
		$.when(getWidgetInfo())
			.pipe(embed)
			.pipe(initCreator)
			.pipe(showButtons)
			.pipe(startHeartBeat)
			.fail(onInitFail)
