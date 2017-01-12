window.Namespace = (ns) ->
	a = ns.split('.')
	o = window
	len = a.length
	for i in [0...len]
		o[a[i]] = o[a[i]] || {}
		o = o[a[i]]
	o

Namespace('Materia').CreatorCore = do ->
	_baseurl       = null
	_creatorClass  = null
	_resizeInterval = null
	_lastHeight = -1

	PRESANITIZE_CHARACTERS =
		'>': '',
		'<': ''

	_onPostMessage = (e) ->
		msg = JSON.parse e.data
		switch msg.type
			when 'initNewWidget'
				_initNewWidget msg.data[0], msg.data[1]
			when 'initExistingWidget'
				_initExistingWidget msg.data[0], msg.data[1], msg.data[2], msg.data[3], msg.data[4]
			when 'onRequestSave'
				_tellCreator 'onSaveClicked', [msg.data[0]]
			when 'onSaveComplete'
				_tellCreator 'onSaveComplete', [msg.data[0], msg.data[1], msg.data[2], msg.data[3]]
			when 'onMediaImportComplete'
				_tellCreator 'onMediaImportComplete', [msg.data[0]]
			when 'onQuestionImportComplete'
				_tellCreator 'onQuestionImportComplete', [msg.data[0]]
			else
				alert 'Error, unknown message sent to creator core: '+msg.type

	_tellCreator = (method, args) ->
		if typeof _creatorClass[method] == 'function'
			_creatorClass[method].apply undefined, args
		else
			alert 'Error, missing creator '+method+' called.'

	_sendPostMessage = (type, data) ->
		parent.postMessage JSON.stringify({type:type, data:data}), '*'

	_initNewWidget = (widget, baseUrl) ->
		_baseurl = baseUrl
		_tellCreator 'initNewWidget', [widget]

	_initExistingWidget = (widget, title, qset, qsetVersion, baseUrl) ->
		_baseurl = baseUrl
		_tellCreator 'initExistingWidget', [widget, title, qset, qsetVersion]

	start = (creatorClass) ->
		# setup the postmessage listener
		if addEventListener?
			addEventListener 'message', _onPostMessage, false
		else if attachEvent?
			attachEvent 'onmessage', _onPostMessage

		if creatorClass.manualResize? and creatorClass.manualResize is false
			_resizeInterval = setInterval () ->
				setHeight()
			, 300

		_creatorClass = creatorClass
		_sendPostMessage 'start', null

	alert = (title, msg, type = 1) ->
		_sendPostMessage 'alert', {title: title, msg: msg, type: type}

	getMediaUrl = (mediaId) ->
		_baseurl+'media/'+mediaId

	# replace a specified list of characters with their safe equivalents
	_preSanitize = (text) ->
		for k, v of PRESANITIZE_CHARACTERS
			text = text.replace new RegExp(k, 'g'), v
		return text

	showMediaImporter = (types = ['jpg','jpeg','gif','png']) ->
		_sendPostMessage 'showMediaImporter', types

	save = (title, qset, version = '1') ->
		sanitizedTitle = _preSanitize title
		_sendPostMessage 'save', [sanitizedTitle, qset, version]

	cancelSave = (msg) ->
		_sendPostMessage 'cancelSave', [msg]

	setHeight = (h) ->
		unless h
			h = $('html').height()
		if h isnt _lastHeight
			_sendPostMessage 'setHeight', [h]
			_lastHeight = h

	escapeScriptTags = (text) ->
		text.replace(/</g, '&lt;').replace(/>/g, '&gt;')

	disableResizeInterval = -> clearInterval _resizeInterval

	# Public Methods
	start:start
	alert:alert
	getMediaUrl:getMediaUrl
	showMediaImporter:showMediaImporter
	cancelSave:cancelSave
	save:save
	disableResizeInterval:disableResizeInterval
	setHeight:setHeight # allows the creator to resize its iframe container to fit the height of its contents
	escapeScriptTags:escapeScriptTags
