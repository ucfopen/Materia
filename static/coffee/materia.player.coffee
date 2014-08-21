Namespace('Materia').Player = do ->
	_baseUrl             = null
	_convertedInstance   = null
	_embedDoneDfD        = null
	_embedTarget         = null
	_inst_id             = null
	_instance            = null
	_isEmbedded          = false
	_isPreview           = false
	_logInterval         = 10000
	_noFlash             = false
	_pendingLogs         = {play:[], storage:[]}
	_play_id             = null
	_qset                = null
	_startTime           = 0
	_widget              = null
	_widgetType          = null
	_endState            = null
	_endLogsPending      = false
	_scoreScreenPending  = false
	_endLogsSent         = false
	_heartbeatIntervalId = -1
	_scoreScreenURL      = null

	init = (gateway, inst_id, embedTarget, baseUrl) ->
		_embedTarget = embedTarget
		_inst_id     = inst_id
		_baseUrl     = baseUrl

		# search for preview or embed directory in the url
		checkForContext = String(window.location).split '/'
		for word in checkForContext
			if word == 'preview'
				_isPreview = true
				$('body').addClass 'preview'
				$('.center').prepend $('<header>').addClass 'preview-bar'
				break

		_isEmbedded = top.location != self.location

		$.when(_getWidgetInstance(), _startPlaySession())
			.pipe(_getQuestionSet)
			.pipe(_embed)
			.pipe(_sendWidgetInit)
			.pipe(_startHeartBeat)
			.fail(_onLoadFail)

	sendPendingLogs = (callback) ->
		callback = $.noop if !callback?

		$.when(_sendPendingStorageLogs())
			.pipe(_sendPendingPlayLogs)
			.done(callback)
			.fail( -> alert('There was a problem saving.'))

	onWidgetReady = ->
		_widget = $('#container').get(0)
		switch
			when !_qset? then _embedDoneDfD.reject 'Unable to load widget data.'
			when !_widget? then _embedDoneDfD.reject 'Unable to load widget.'
			else _embedDoneDfD.resolve()

	addLog = (log) ->
		# add to pending logs
		log['game_time'] = ((new Date()).getTime() - _startTime) / 1000 # log time in seconds
		_pendingLogs.play.push log

	sendStorage = (log) ->
		_pendingLogs.storage.push log if !_isPreview

	end = (showScoreScreenAfter = yes) ->
		switch _endState
			when 'sent'
				_showScoreScreen() if showScoreScreenAfter
			when 'pending'
				if showScoreScreenAfter then _scoreScreenPending = yes
			else
				_endState = 'pending'
				# kill the heartbeat
				clearInterval _heartbeatIntervalId
				# required to end a play
				addLog({type:2, item_id:0, text:'', value:null})
				# send anything remaining
				sendPendingLogs ->
					# Async callback after final logs are sent
					_endState = 'sent'
					# shows the score screen upon callback if requested any time betwen method call and now
					if showScoreScreenAfter or _scoreScreenPending then _showScoreScreen()

	_startHeartBeat = ->
		dfd = $.Deferred().resolve()
		setInterval ->
			Materia.Coms.Json.send 'session_valid', [null, false], (data) ->
				if data == false
					alert 'You have been logged out due to inactivity.\n\nPlease login again.'
					window.location.reload()
		, 30000
		dfd.promise()

	_sendWidgetInit = ->
		dfd = $.Deferred().resolve()
		_convertedInstance = _translateForApiVersion _instance
		_startTime = (new Date()).getTime()
		_sendToWidget 'initWidget', if _widgetType is '.swf' then [_qset, _convertedInstance] else [_qset, _convertedInstance, _baseUrl]
		if !_isPreview
			_heartbeatIntervalId = setInterval sendPendingLogs, _logInterval # if not in preview mode, set the interval to send logs

		dfd.promise()

	_sendToWidget = (type, args) ->
		switch _widgetType
			when '.swf'
				_widget[type].apply _widget, args
			when '.html'
				_widget.contentWindow.postMessage JSON.stringify({type:type, data:args}), STATIC_CROSSDOMAIN

	_onLoadFail = (msg) ->
			alert "Failure: #{msg}"

	_embed = ->
		dfd = $.Deferred()

		_widgetType = _instance.widget.player.slice _instance.widget.player.lastIndexOf '.'

		if _instance.widget.player.substring(0,4) == 'http'
			# allow player paths to be absolute urls
			enginePath = _instance.widget.player
		else
			# link to the static widget
			enginePath = WIDGET_URL+_instance.widget.dir + _instance.widget.player

		switch _widgetType
			when '.swf'
				_embedFlash enginePath, '10', dfd
			when '.html'
				_embedHTML enginePath, dfd
		dfd.promise()

	_embedFlash = (enginePath, version, dfd) ->
		# register global callbacks for ExternalInterface calls
		window.__materia_sendStorage     = sendStorage
		window.__materia_onWidgetReady   = onWidgetReady
		window.__materia_sendPendingLogs = sendPendingLogs
		window.__materia_end             = end
		window.__materia_addLog          = addLog
		params     = {menu:'false', allowFullScreen:'true', AllowScriptAccess:'always'}
		attributes = {id: _embedTarget}
		express    = BASE_URL+'assets/flash/expressInstall.swf'
		width      = '100%'
		height     = '100%'
		flashvars  =
			inst_id:_inst_id
			GIID:_inst_id
			URL_WEB:BASE_URL
			URL_GET_ASSET:'media/'

		if ie8Browser?
			width  = '99.7%'
			height = '99.7%'

		_embedDoneDfD = dfd
		swfobject.embedSWF enginePath, _embedTarget, width, height, String(version), express, flashvars, params, attributes

	_embedHTML = (enginePath, dfd) ->
		_embedDoneDfD = dfd
		$iframe = $('<iframe src="'+enginePath+'" id="container" scrolling="no" class="html"></iframe>')
		container = $('#container').replaceWith($iframe)
		container.width _instance.widget.width if _instance.widget.width > 0
		container.height _instance.widget.height if _instance.widget.height > 0

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
					when 'sendPendingLogs' then sendPendingLogs()
					when 'alert'           then _alert msg.data
					when 'setHeight'       then _setHeight msg.data[0]
					when 'initialize'      then
					else                   throw new Error "Unknown PostMessage recieved from player core: #{msg.type}"
			else
				throw new Error "Post message Origin does not match.  Expected: #{expectedOrigin}, Actual: #{e.origin}"

		# setup the postmessage listener
		if addEventListener?
			addEventListener 'message', _onPostMessage, false
		else if attachEvent?
			attachEvent 'onmessage', _onPostMessage

	_getWidgetInstance = ->
		dfd = $.Deferred()

		dfd.reject('Flash Player required.') if(_noFlash)

		Materia.Coms.Json.send 'widget_instances_get', [[_inst_id]], (widgetInstances) ->
			dfd.reject('Unable to get widget info.') if widgetInstances.length < 1
			_instance = widgetInstances[0]
			type = _instance.widget.player.split('.').pop()
			version = parseInt _instance.widget.flash_version, 10

			if type == 'swf' &&  swfobject.hasFlashPlayerVersion(String(version)) == false
				_showNoFlashWarning()
				dfd.reject 'Newer Flash Player version required.'
			else
				$('.center').width _instance.widget.width if _instance.widget.width > 0
				$('.center').height _instance.widget.height if _instance.widget.height > 0
				dfd.resolve()

			$('.widget').show()

		dfd.promise()

	_showNoFlashWarning = ->
		_noFlash = true
		$('body').addClass 'no-flash'
		$('.widget').show()
		$('#no_flash').show()

	_startPlaySession = ->
		dfd = $.Deferred()

		switch
			when _noFlash then dfd.reject 'Flash Player Required.'
			when _isPreview then dfd.resolve()
			else
				# get the play id from the embedded variable on the page:
				_play_id = __PLAY_ID

				if _play_id?
					dfd.resolve()
				else
					dfd.reject 'Unable to start play session.'

		dfd.promise()

	_getQuestionSet = ->
		dfd = $.Deferred()
		# TODO: if bad qSet : dfd.reject('Unable to load questions.')
		Materia.Coms.Json.send 'question_set_get', [_inst_id, _play_id], (result) ->
			_qset = result
			dfd.resolve()

		dfd.promise()

	_sendPendingPlayLogs = ->
		dfd = $.Deferred()

		if _pendingLogs.play.length > 0
			args = [_play_id, _pendingLogs.play]
			if _isPreview then args.push _inst_id
			Materia.Coms.Json.send 'play_logs_save', args, (result) ->
				if result? && result.score_url?
					_scoreScreenURL = result.score_url
				dfd.resolve()
			_pendingLogs.play = []
		else
			dfd.resolve()

		dfd.promise()

	_sendPendingStorageLogs = ->
		dfd = $.Deferred()

		if !_isPreview and _pendingLogs.storage.length > 0
			Materia.Coms.Json.send 'play_storage_data_save', [_play_id, _pendingLogs.storage], -> dfd.resolve()
			_pendingLogs.storage = []
		else
			dfd.resolve()

		dfd.promise()

	# converts current widget/instance structure to the one expected by the player
	_translateForApiVersion = (inst) ->
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

	_setHeight = (h) ->
		# don't resize the inner iframe if the player is embedded
		if window.top == window.self
			min_h = _instance.widget.height
			if h > min_h then $('#container').height h else $('#container').height min_h

	_showScoreScreen = ->
		if _scoreScreenURL == null
			if _isPreview
				_scoreScreenURL = "#{BASE_URL}scores/preview/#{_inst_id}"
			else if _isEmbedded
				_scoreScreenURL = "#{BASE_URL}scores/embed/#{_inst_id}"
			else
				_scoreScreenURL = "#{BASE_URL}scores/#{_inst_id}"

		window.location = _scoreScreenURL

	_alert = (options) ->
		title = options.title
		msg = options.msg
		type = options.type
		alertWindow = $("<div>")
		alertWindow.append('<h1>'+title+'</h1>')
		alertWindow.append('<p>'+msg+'</p>')

		buttons = []
		switch type
			when 1 then buttons = ['OK']
			when 2 then buttons = ['OK', 'Cancel']
			when 3 then buttons = ['Yes', 'No']
		alertWindow.append('<button class="action_button">'+b+'</button>') for b in buttons

		$.jqmodal.standalone {
			modal            : true,
			backgroundStyle  : 'light',
			className        : 'alert',
			html             : alertWindow.html(),
			closingSelectors : ['button']
		}

	init:init
