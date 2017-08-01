app = angular.module 'materia'
app.controller 'playerCtrl', ($scope, $sce, $timeout, widgetSrv, userServ, PLAYER, Alert) ->

	$scope.alert = Alert

	# Keep track of a promise
	embedDoneDfD = null
	# Widget instance
	instance = null
	# Logs that have yet to be synced
	pendingLogs = {play:[], storage:[]}
	# ID of the current play, received from embedded inline script variables
	play_id = null
	# hold onto the qset from the instance
	qset = null
	# the time the widget starts playing
	startTime = 0
	# widget container object, used for postMessage
	widget = null
	# .swf or .html
	widgetType = null
	# Keeps the state of whether scores have been sent yet when receiving .end() calls from widgets
	endState = null
	# Whether or not to show the score screen as soon as playlogs get synced
	scoreScreenPending = false
	# Keep track of the timer id for the heartbeat so we can clear the timeout
	heartbeatIntervalId = -1
	# Calculates which screen to show (preview, embed, or normal)
	scoreScreenURL = null
	# Whether or not to show the embed view
	isEmbedded = top.location != self.location
	# Queue of requests
	pendingQueue = []
	# Whether or not a queue push is in progress
	logPushInProgress = false
	# number of times the logs an retried sending
	retryCount = 0
	# search for preview or embed directory in the url
	checkForContext = String(window.location).split '/'
	# Controls whether the view has a "preview" header bar
	$scope.isPreview = false
	# Controls whether or not the widget iframe will allow fullscreen behavior (disabled by default)
	$scope.allowFullScreen = false

	for word in checkForContext
		if word == 'preview'
			$scope.isPreview = true
			break

	sendAllPendingLogs = (callback) ->
		callback = $.noop if !callback?

		$.when(sendPendingStorageLogs())
			.pipe(sendPendingPlayLogs)
			.done(callback)
			.fail( -> _alert('There was a problem saving.', 'Something went wrong...', false))

	onWidgetReady = ->
		widget = $('#'+PLAYER.EMBED_TARGET).get(0)
		switch
			when !qset? then embedDoneDfD.reject 'Unable to load widget data.'
			when !widget? then embedDoneDfD.reject 'Unable to load widget.'
			else embedDoneDfD.resolve()

	addLog = (log) ->
		# add to pending logs
		log['game_time'] = ((new Date()).getTime() - startTime) / 1000 # log time in seconds
		pendingLogs.play.push log

	sendStorage = (log) ->
		pendingLogs.storage.push log if !$scope.isPreview

	end = (showScoreScreenAfter = yes) ->
		switch endState
			when 'sent'
				showScoreScreen() if showScoreScreenAfter
			when 'pending'
				if showScoreScreenAfter then scoreScreenPending = yes
			else
				endState = 'pending'
				# kill the heartbeat
				clearInterval heartbeatIntervalId
				# required to end a play
				addLog({type:2, item_id:0, text:'', value:null})
				# send anything remaining
				sendAllPendingLogs ->
					# Async callback after final logs are sent
					endState = 'sent'
					# shows the score screen upon callback if requested any time betwen method call and now
					if showScoreScreenAfter or scoreScreenPending then showScoreScreen()

	startHeartBeat = ->
		dfd = $.Deferred().resolve()
		setInterval ->
			Materia.Coms.Json.send 'session_play_verify', [play_id], (result) ->
				if result != true and instance.guest_access is false
					_alert 'Your play session is no longer valid! This may be due to logging out, your session expiring, or trying to access another Materia account simultaneously. You\'ll need to reload the page to start over.', 'Invalid session', true
		, 30000
		dfd.promise()

	sendWidgetInit = ->
		dfd = $.Deferred().resolve()
		convertedInstance = translateForApiVersion instance
		startTime = (new Date()).getTime()
		sendToWidget 'initWidget', if widgetType is '.swf' then [qset, convertedInstance] else [qset, convertedInstance, BASE_URL, MEDIA_URL]
		if !$scope.isPreview
			heartbeatIntervalId = setInterval sendAllPendingLogs, PLAYER.LOG_INTERVAL # if not in preview mode, set the interval to send logs

		dfd.promise()

	sendToWidget = (type, args) ->
		switch widgetType
			when '.swf'
				widget[type].apply widget, args
			when '.html'
				widget.contentWindow.postMessage JSON.stringify({type:type, data:args}), STATIC_CROSSDOMAIN

	onLoadFail = (msg) ->
			_alert "Failure: #{msg}", null, true

	embed = ->
		dfd = $.Deferred()

		widgetType = instance.widget.player.slice instance.widget.player.lastIndexOf '.'

		if instance.widget.player.substring(0,4) == 'http'
			# allow player paths to be absolute urls
			enginePath = instance.widget.player
		else
			# link to the static widget
			enginePath = WIDGET_URL+instance.widget.dir + instance.widget.player

		if instance.widget.width > 0 then $('.preview-bar').width instance.widget.width

		switch widgetType
			when '.swf'
				embedFlash enginePath, '10', dfd
			when '.html'
				embedHTML enginePath, dfd
		dfd.promise()

	embedFlash = (enginePath, version, dfd) ->
		# register global callbacks for ExternalInterface calls
		window.__materia_sendStorage     = sendStorage
		window.__materia_onWidgetReady   = onWidgetReady
		window.__materia_sendPendingLogs = sendAllPendingLogs
		window.__materia_end             = end
		window.__materia_addLog          = addLog
		params     = {menu:'false', allowFullScreen:'true', AllowScriptAccess:'always'}
		attributes = {id: PLAYER.EMBED_TARGET}
		express    = BASE_URL+'assets/flash/expressInstall.swf'
		width      = '100%'
		height     = '100%'
		flashvars  =
			inst_id:$scope.inst_id
			GIID:$scope.inst_id
			URL_WEB:BASE_URL
			URL_GET_ASSET:'media/'

		if ie8Browser?
			width  = '99.7%'
			height = '99.7%'

		embedDoneDfD = dfd
		$scope.type = "flash"
		$scope.$apply()
		swfobject.embedSWF enginePath, PLAYER.EMBED_TARGET, width, height, String(version), express, flashvars, params, attributes

	embedHTML = (enginePath, dfd) ->
		embedDoneDfD = dfd

		$scope.type = "html"
		$scope.htmlPath = enginePath + "?" + instance.widget.created_at
		$('#'+PLAYER.EMBED_TARGET).width instance.widget.width if instance.widget.width > 0
		$('#'+PLAYER.EMBED_TARGET).height instance.widget.height if instance.widget.height > 0

		# build a link element to deconstruct the static url
		# this helps us match static url against the event origin
		a = document.createElement('a')
		a.href = STATIC_CROSSDOMAIN
		expectedOrigin = a.href.substr(0, a.href.length - 1)

		_onPostMessage = (e) ->
			if e.origin == expectedOrigin
				msg = JSON.parse e.data
				switch msg.type
					when 'start'           then onWidgetReady()
					when 'addLog'          then addLog(msg.data)
					when 'end'             then end(msg.data)
					when 'sendStorage'     then sendStorage(msg.data)
					when 'sendPendingLogs' then sendAllPendingLogs()
					when 'alert'           then _alert msg.data, 'Warning!', false
					when 'setHeight'       then setHeight msg.data[0]
					when 'initialize'      then
					else                   throw new Error "Unknown PostMessage received from player core: #{msg.type}"
			else
				throw new Error "Post message Origin does not match.  Expected: #{expectedOrigin}, Actual: #{e.origin}"

		# setup the postmessage listener
		if addEventListener?
			addEventListener 'message', _onPostMessage, false
		$scope.$apply()

	getWidgetInstance = ->
		dfd = $.Deferred()

		dfd.reject('Flash Player required.') if $scope.type == "noflash"

		widgetSrv.getWidget $scope.inst_id, (widgetInstances) ->
			dfd.reject('Unable to get widget info.') if widgetInstances.length < 1
			instance = widgetInstances[0]
			type = instance.widget.player.split('.').pop()
			version = parseInt instance.widget.flash_version, 10

			# Fullscreen flag set as an optional parameter in widget install.yaml; have to dig into instance widget's meta_data object to find it
			# can't use array.includes() since it's necessary to ensure comparison is case insensitive
			for feature in instance.widget.meta_data.features
				if feature.toLowerCase() is "fullscreen" then $scope.allowFullScreen = true

			if type == 'swf' && swfobject.hasFlashPlayerVersion(String(version)) == false
				$scope.type = "noflash"
				dfd.reject 'Newer Flash Player version required.'
			else
				$('.center').width instance.widget.width if instance.widget.width > 0
				$('.center').height instance.widget.height if instance.widget.height > 0
				dfd.resolve()

			$('.widget').show()

		$scope.$apply()

		dfd.promise()

	startPlaySession = ->
		dfd = $.Deferred()

		switch
			when $scope.type == "noflash" then dfd.reject 'Flash Player Required.'
			when $scope.isPreview then dfd.resolve()
			else
				# get the play id from the embedded variable on the page:
				play_id = PLAY_ID

				if play_id?
					dfd.resolve()
				else
					dfd.reject 'Unable to start play session.'

		dfd.promise()

	getQuestionSet = ->
		dfd = $.Deferred()
		# TODO: if bad qSet : dfd.reject('Unable to load questions.')
		Materia.Coms.Json.send 'question_set_get', [$scope.inst_id, play_id], (result) ->
			qset = result
			dfd.resolve()

		dfd.promise()

	pushPendingLogs = ->
		return if logPushInProgress
		logPushInProgress = true

		# This shouldn't happen, but its a sanity check anyhow
		if pendingQueue.length == 0
			logPushInProgress = false
			return

		(Materia.Coms.Json.send 'play_logs_save', pendingQueue[0].request, (result) ->
			retryCount = 0 # reset on success
			if $scope.alert.fatal then $scope.alert.fatal = false
			if result? && result.score_url?
				scoreScreenURL = result.score_url
			else if result? && result.type is "error"
				if result.msg
					_alert result.msg, 'Something went wrong...', true
				else
					_alert 'Your play session is no longer valid! This may be due to logging out, your session expiring, or trying to access another Materia account simultaneously. You\'ll need to reload the page to start over.', 'Something went wrong...', true

			previous = pendingQueue.shift()
			previous.promise.resolve()

			logPushInProgress = false

			if pendingQueue.length > 0
				pushPendingLogs()

		).fail ->
			retryCount++
			retrySpeed = PLAYER.RETRY_FAST

			if retryCount > PLAYER.RETRY_LIMIT
				retrySpeed = PLAYER.RETRY_SLOW
				_alert 'Connection to Materia\'s server was lost. Check your connection or reload to start over.', 'Something went wrong...', true

			setTimeout ->
				logPushInProgress = false
				pushPendingLogs()
			, retrySpeed

	sendPendingPlayLogs = ->
		dfd = $.Deferred()

		if pendingLogs.play.length > 0
			args = [play_id, pendingLogs.play]
			if $scope.isPreview then args.push $scope.inst_id
			pendingQueue.push { request: args, promise: dfd }
			pushPendingLogs()

			pendingLogs.play = []
		else
			dfd.resolve()

		dfd.promise()

	sendPendingStorageLogs = ->
		dfd = $.Deferred()

		if !$scope.isPreview and pendingLogs.storage.length > 0
			Materia.Coms.Json.send 'play_storage_data_save', [play_id, pendingLogs.storage], ->
				dfd.resolve()
			pendingLogs.storage = []
		else
			dfd.resolve()

		dfd.promise()

	# converts current widget/instance structure to the one expected by the player
	translateForApiVersion = (inst) ->
		# switch based on version expected by the widget
		switch parseInt inst.widget.api_version
			when 1
				output =
					startDate: inst.open_at
					playable: inst.widget.is_playable
					embedUrl: inst.embed_url
					engineName: inst.widget.name
					endDate: inst.close_at
					GRID: inst.widget.id
					type: inst.widget.type
					dateCreate: inst.created_at
					version: ''
					playUrl: inst.play_url
					QSET: inst.qset
					isDraft: inst.is_draft
					height: inst.widget.height
					dir: inst.group
					storesData: inst.widget.is_storage_enabled
					name: inst.name
					engineID: inst.widget.id
					GIID: inst.id
					flVersion: inst.flash_version
					isQSetEncrypted: inst.widget.is_qset_encrypted
					cleanName: inst.widget.clean_name
					attemptsAllowed: inst.attempts
					recordsScores: inst.widget.is_scorable
					width: inst.widget.width
					isAnswersEncrypted: inst.widget.is_answer_encrypted
					cleanOwner: ''
					editable: inst.widget.is_editable
					previewUrl: inst.preview_url
					userID: inst.user_id
					scoreModule: inst.widget.score_module
			when 2
				output = inst
			else
				output = inst
		output

	setHeight = (h) ->
		min_h = instance.widget.height
		if h > min_h then $('.center').height h else $('.center').height min_h

	showScoreScreen = ->
		if scoreScreenURL == null
			if $scope.isPreview
				scoreScreenURL = "#{BASE_URL}scores/preview/#{$scope.inst_id}"
			else if isEmbedded
				scoreScreenURL = "#{BASE_URL}scores/embed/#{$scope.inst_id}#play-#{play_id}"
			else
				scoreScreenURL = "#{BASE_URL}scores/#{$scope.inst_id}#play-#{play_id}"

		window.location = scoreScreenURL unless $scope.alert.fatal

	window.onbeforeunload = (e) ->
		if instance.widget.is_scorable is "1" and !$scope.isPreview and endState != 'sent'
			return "Wait! Leaving now will forfeit this attempt. To save your score you must complete the widget."
		else return undefined

	_alert = (msg, title = null, fatal = false) ->
		$scope.$apply ->
			$scope.alert.msg = msg
			$scope.alert.title = title if title isnt null
			$scope.alert.fatal = fatal

	$timeout ->
		$.when(getWidgetInstance(), startPlaySession())
			.pipe(getQuestionSet)
			.pipe(embed)
			.pipe(sendWidgetInit)
			.pipe(startHeartBeat)
			.fail(onLoadFail)

# Tiny directive that handles applying the "allowfullscreen" attribute to the player iframe
# since the attribute does not take a parameter, it isn't as easy as allowfullscreen = {{allowFullScreen}} on the actual DOM element
app.directive "fullscreenDir", () ->
	restrict: "A",
	link: ($scope, $element, $attrs) ->
		$scope.$watch "allowFullScreen", (newVal, oldVal) ->
			if newVal is true then $attrs.$set "allowfullscreen", ""
