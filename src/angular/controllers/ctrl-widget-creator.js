const app = angular.module('materia')
app.controller('WidgetCreatorCtrl', function (
	Please,
	$scope,
	$q,
	$sce,
	$timeout,
	$interval,
	WidgetSrv,
	Alert
) {
	$scope.alert = Alert
	$scope.embedDialogType = 'embed_dialog'
	$scope.showActionBar = true

	const HEARTBEAT_INTERVAL = 30000
	// How far from the top of the window that the creator frame starts
	const BOTTOM_OFFSET = 145
	// Where to embed flash
	const EMBED_TARGET = 'container'

	let creator = null
	let embedDonePromise = null
	let heartbeat = null
	let inst_id = null
	let instance = null
	let keepQSet = null
	let saveMode = false
	let type = null
	let widget_id = null
	let widget_info = null
	let widgetType = null
	let mediaFile = null

	// qset storage for previous save feature
	let qsetToBeCached = null // current working qset, temporarily cached to await confirm/cancel
	let qsetToReload = null // qset selected to be loaded after requested reload

	const _requestSave = (mode) => {
		// hide dialogs
		$scope.popup = ''

		saveMode = mode
		$scope.saveStatus = 'saving'
		switch (saveMode) {
			case 'publish':
				$scope.previewText = 'Saving...'
				break
			case 'save':
				$scope.saveText = 'Saving...'
				break
		}

		sendToCreator('onRequestSave', [mode])
	}

	// Popup a question importer dialog
	const _showQuestionImporter = () => {
		// must be loose comparison
		const types = widget_info.meta_data.supported_data
		//the value passed on needs to be a list of one or two elements, i.e.
		//?type=QA or ?type=MC or ?type=QA,MC
		showEmbedDialog(`${BASE_URL}questions/import/?type=${encodeURIComponent(types.join())}`)
		return null // else Safari will give the .swf data that it can't handle
	}

	const _showQsetHistoryImporter = () => {
		showEmbedDialog(`${BASE_URL}qsets/import/?inst_id=${inst_id}`)
		return null
	}

	const _showQsetHistoryConfirmation = () => {
		$scope.embedDialogType = 'confirm_dialog'
		showEmbedDialog(`${BASE_URL}qsets/confirm/?inst_id=${inst_id}`)
		return null
	}

	const _onPublishPressed = () => {
		if (inst_id != null && instance != null && !instance.is_draft) {
			// Show the Update Dialog
			$scope.popup = 'update'
		} else {
			// Show the Publish Dialog
			$scope.popup = 'publish'
		}
	}

	const _cancelPublish = (e) => {
		$scope.popup = ''
	}

	const _cancelPreview = (e) => {
		$scope.popup = ''
	}

	// If Initialization Fails
	const onInitFail = (msg) => {
		stopHeartBeat()
		if (msg.toLowerCase() !== 'flash player required.') {
			_alert(msg, 'Failure', true, false)
		}
	}

	// Every 30 seconds, renew/check the session
	const startHeartBeat = () => {
		const deferred = $q.defer()
		heartbeat = $interval(() => {
			Materia.Coms.Json.send('session_author_verify', [null, false]).then((data) => {
				if (data !== true) {
					_alert('You have been logged out due to inactivity', 'Invalid Login', true, true)
					Please.$apply()
					stopHeartBeat()
				}
			})
		}, HEARTBEAT_INTERVAL)

		deferred.resolve()
		return deferred.promise
	}

	const stopHeartBeat = () => {
		$interval.cancel(heartbeat)
	}

	// Gets the qset of a loaded instance
	const getQset = () => {
		return Materia.Coms.Json.send('question_set_get', [inst_id]).then((data) => {
			if (
				(data != null ? data.title : undefined) === 'Permission Denied' ||
				data.title === 'error'
			) {
				$scope.invalid = true
				Please.$apply()
			} else {
				keepQSet = data
			}
		})
	}

	// Starts the Creator, sending required widget data
	const initCreator = () => {
		let args
		const deferred = $q.defer()

		if (inst_id != null) {
			args = [instance.name, instance.widget, keepQSet.data, keepQSet.version, BASE_URL]
			if (widgetType !== '.swf') {
				args.push(MEDIA_URL)
			} // Passing MEDIA_URL breaks the SWF, so omit it for Flash widgets! The intent is to sunset Flash support relatively soon after this code is committed.

			sendToCreator('initExistingWidget', args)
		} else {
			args = [widget_info, BASE_URL]
			if (widgetType !== '.swf') {
				args.push(MEDIA_URL)
			} //  Passing MEDIA_URL breaks the SWF, so omit it for Flash widgets! The intent is to sunset Flash support relatively soon after this code is committed.

			sendToCreator('initNewWidget', args)
		}

		deferred.resolve()
		return deferred.promise
	}

	// Send messages to the creator, handles flash and html creators
	const sendToCreator = (type, args) => {
		switch (widgetType) {
			case '.swf':
				return creator[type].apply(creator, args)
			case '.html':
				return creator.contentWindow.postMessage(
					JSON.stringify({ type, data: args }),
					STATIC_CROSSDOMAIN
				)
		}
	}

	const prePublishPermsCheck = (widgetData) => {
		const deferred = $q.defer()
		checkUserPublishPerms(widgetData, true).then(() => deferred.resolve(widgetData))
		return deferred.promise
	}

	const checkUserPublishPerms = (widgetData, newInstance) => {
		const deferred = $q.defer()
		WidgetSrv.canBePublishedByCurrentUser(widget_id).then((canPublish) => {
			$scope.canPublish = canPublish

			// if the widget is published and the current user can not publish it, then they can not edit it
			// also make sure that this isn't the creation of a new widget - which technically is also not a draft
			if (!newInstance && !widgetData.is_draft && !canPublish)
				deferred.reject('Widget type can not be edited by students after publishing.')

			deferred.resolve(widgetData)
		})
		return deferred.promise
	}

	// build a my-widgets url to a specific widget
	const getMyWidgetsUrl = (instid) => `${BASE_URL}my-widgets#${instid}`

	// Embeds the creator
	const embed = (widgetData) => {
		const deferred = $q.defer()

		let creatorPath
		if (widgetData != null ? widgetData.widget : undefined) {
			instance = widgetData
			widget_info = instance.widget
		} else {
			widget_info = widgetData
		}

		$scope.nonEditable = widget_info.is_editable === '0'

		widgetType = widget_info.creator.slice(widget_info.creator.lastIndexOf('.'))

		// allow creator paths to be absolute urls
		if (widget_info.creator.substring(0, 4) === 'http') {
			creatorPath = widget_info.creator
			// link to the static widget
		} else {
			creatorPath = WIDGET_URL + widget_info.dir + widget_info.creator
		}

		$scope.loaded = true
		$scope.type = creatorPath.split('.').pop()
		Please.$apply()

		// the embed process will reolve this later
		embedDonePromise = deferred

		$timeout(() => {
			switch (widgetType) {
				case '.swf':
					embedFlash(creatorPath, widget_info.flash_version)
					break
				case '.html':
					embedHTML(creatorPath)
					break
			}
		})

		return deferred.promise
	}

	const embedHTML = (htmlPath) => {
		$scope.htmlPath = htmlPath + '?' + widget_info.created_at
		Please.$apply()

		const onPostMessage = (e) => {
			const origin = `${e.origin}/`
			if (origin === STATIC_CROSSDOMAIN || origin === BASE_URL) {
				const msg = JSON.parse(e.data)
				switch (
					msg.source // currently 'creator-core' || 'media-importer' - can be extended to other sources
				) {
					case 'media-importer':
						// options for media-importer postMessages
						switch (msg.type) {
							// broadcast by the importer when showMediaImporter is called
							// if a file is pre-selected (by direct upload pipeline), go ahead and send it over
							// this behavior only occurs for direct media uploads, bypassing user input
							case 'readyForDirectUpload':
								if (mediaFile) return e.source.postMessage(mediaFile, e.origin)
								else return false
							default:
								return false
						}

					case 'creator-core':
					default:
						// options for creator-core postMessages
						switch (msg.type) {
							case 'start': // The creator notifies us when its ready
								return onCreatorReady()
							case 'save': // The creator issued a save request
								return save(msg.data[0], msg.data[1], msg.data[2]) // instanceName, qset
							case 'cancelSave': // the creator canceled a save request
								return onSaveCanceled(msg.data[0]) // msg
							case 'showMediaImporter': // the creator wants to import media
								return showMediaImporter(msg.data)
							case 'directUploadMedia': // the creator is requesting to directly upload a media file, bypassing user input
								return directUploadMedia(msg.data)
							case 'setHeight': // the height of the creator has changed
								return setHeight(msg.data[0])
							case 'alert':
								return _alert(msg.data.msg, msg.data.title, msg.data.fatal)
							default:
								return console.warn(`Unknown message from creator: ${msg.type}`)
						}
				}
			}

			console.warn(`Unknown message from creator: ${origin}`)
		}

		// setup the postmessage listener
		window.addEventListener('message', onPostMessage, false)
	}

	const embedFlash = (path, version) => {
		// register global callbacks for ExternalInterface calls
		window.__materia_flash_onCreatorReady = onCreatorReady
		window.__materia_flash_importMedia = showMediaImporter
		window.__materia_flash_save = save
		window.__materia_flash_cancelSave = onSaveCanceled

		if (swfobject.hasFlashPlayerVersion('1') === false) {
			$scope.type = 'noflash'
			Please.$apply()
		} else {
			// setup variable to send to flash
			const flashvars = {
				URL_WEB: BASE_URL,
				URL_GET_ASSET: MEDIA_URL,
				widget_id,
				inst_id,
			}

			const params = {
				menu: 'false',
				allowFullScreen: 'true',
				AllowScriptAccess: 'always',
			}
			const attributes = { id: EMBED_TARGET, wmode: 'opaque' }
			const expressSwf = `${STATIC_CROSSDOMAIN}js/vendor/swfobject/expressInstall.swf`
			let width = '100%'
			let height = '100%'

			swfobject.embedSWF(
				path,
				EMBED_TARGET,
				width,
				height,
				version,
				expressSwf,
				flashvars,
				params,
				attributes
			)
		}
	}

	// Show the buttons that interact with the creator
	const showButtons = () => {
		const deferred = $q.defer()

		// change the buttons if this isnt a draft
		if (instance && !instance.is_draft) {
			$scope.publishText = 'Update'
			$scope.updateMode = true
		}
		enableReturnLink()
		$scope.showActionBar = true
		Please.$apply()

		deferred.resolve()
		return deferred.promise
	}

	// Changes the Return link's functionality depending on use
	const enableReturnLink = () => {
		if (inst_id != null) {
			// editing
			$scope.returnUrl = getMyWidgetsUrl(inst_id)
			$scope.returnPlace = 'my widgets'
		} else {
			// new
			$scope.returnUrl = `${BASE_URL}widgets`
			$scope.returnPlace = 'widget catalog'
		}

		Please.$apply()
	}

	const onPreviewPopupBlocked = (url) => {
		$scope.popup = 'blocked'
		$scope.previewUrl = url
		Please.$apply()
	}

	// When the creator says it's ready
	// Note this is psuedo public as it's exposed to flash
	const onCreatorReady = () => {
		creator = document.querySelector('#container')
		// resize swf now and when window resizes
		if (qsetToReload != null) {
			keepQSet = {
				data: qsetToReload.data,
				version: qsetToReload.version,
			}
			initCreator()
			qsetToReload = null
		}

		return embedDonePromise.resolve() // used to keep events synchronous
	}

	// Show an embedded dialog, as opposed to a popup
	const showEmbedDialog = (url) => ($scope.iframeUrl = url)

	// move the embed dialog off to invisibility
	const hideEmbedDialog = () => {
		$scope.iframeUrl = ''
		$scope.embedDialogType = 'embed_dialog'
		$scope.modal = false
		$timeout(() => {
			Please.$apply()
		}, 0)
	}

	// Note this is psuedo public as it's exposed to flash
	const showMediaImporter = (types) => {
		showEmbedDialog(`${BASE_URL}media/import#${types.join(',')}`)
		$scope.modal = true
		$timeout(() => {
			Please.$apply()
		}, 0)
		return null // else Safari will give the .swf data that it can't handle
	}

	// Called by the creator when a direct upload of media is requested - instead of asking user to select one themselves
	// Displays the media importer (which dispatches 'readyForDirectUpload') and pre-selects the mediaFile to be uploaded
	const directUploadMedia = (media) => {
		showMediaImporter(['jpg', 'gif', 'png', 'mp3'])
		mediaFile = media
	}

	// save called by the widget creator
	// Note this is psuedo public as it's exposed to flash
	const save = (instanceName, qset, version) => {
		if (version == null) {
			version = 1
		}
		let w = {
			widget_id,
			name: instanceName,
			qset: { version, data: qset },
			is_draft: saveMode !== 'publish',
			inst_id,
		}

		// 'history' is sent from onQsetHistorySelectionComplete to request the current qset trait from the creator
		// since the qset is all we need, no need to save to the DB
		if (saveMode == 'history') {
			qsetToBeCached = {
				qset,
				version,
			}
			return false
		}

		return WidgetSrv.saveWidget(w).then((inst) => {
			// did we get back an error message?
			if ((inst != null ? inst.msg : undefined) != null) {
				onSaveCanceled(inst)
				$scope.alert.fatal = inst.halt
				Please.$apply()
			} else if (inst != null && inst.id != null) {
				// update this creator's url
				if (String(inst_id).length !== 0) {
					window.location.hash = `#${inst.id}`
				}

				switch (saveMode) {
					case 'preview':
						var url = `${BASE_URL}preview/${inst.id}`
						var popup = window.open(url)
						inst_id = inst.id
						if (popup != null) {
							$timeout(() => {
								if (!(popup.innerHeight > 0)) {
									return onPreviewPopupBlocked(url)
								}
							}, 200)
						} else {
							onPreviewPopupBlocked(url)
						}
						break
					case 'publish':
						window.location = getMyWidgetsUrl(inst.id)
						break
					case 'save':
						$scope.saveText = 'Saved!'
						sendToCreator('onSaveComplete', [
							inst.name,
							inst.widget,
							inst.qset.data,
							inst.qset.version,
						])
						inst_id = inst.id
						instance = inst
						$scope.saveStatus = 'saved'
						break
				}

				Please.$apply()
				$timeout(() => {
					$scope.saveText = 'Save Draft'
					$scope.saveStatus = 'idle'
					return Please.$apply()
				}, 5000)
			}
		})
	}

	// When the Creator cancels a save request
	// Note this is psuedo public as it's exposed to flash
	const onSaveCanceled = (msg) => {
		$scope.saveText = 'Can Not Save!'

		if ((msg != null ? msg.msg : undefined) != null) {
			if (msg.halt != null) {
				_alert(
					`Unfortunately, your progress was not saved because \
${msg.msg.toLowerCase()}. Any unsaved progress will be lost.`,
					'Invalid Login',
					true,
					true
				)
				return stopHeartBeat()
			}
		} else {
			if (msg) {
				return _alert(
					`Unfortunately your progress was not saved because \
${msg.toLowerCase()}`,
					'Hold on a sec',
					false,
					false
				)
			}
		}
	}

	const setHeight = (h) => {
		creator.style.height = `${h}px`
	}

	const _alert = (msg, title = 'Warning!', fatal = false, enableLoginButton = false) => {
		$scope.alert.msg = msg
		$scope.alert.title = title
		$scope.alert.fatal = fatal
		$scope.alert.enableLoginButton = enableLoginButton
		Please.$apply()
	}

	const _qsetRollbackConfirmation = (confirm) => {
		$scope.showActionBar = true
		$scope.showRollbackConfirmBar = false

		if (confirm) {
			return false
		} else {
			// re-apply cached qset saved via onQsetHistorySelectionComplete
			qsetToReload = {
				data: qsetToBeCached.qset,
				version: qsetToBeCached.version,
			}
			sendToCreator('reloadCreator')
		}
	}

	// Exposed to the window object so that popups and frames can use this public functions
	Namespace('Materia').Creator = {
		// Exposed to the question importer screen
		onQuestionImportComplete(questions) {
			hideEmbedDialog()
			if (!questions) {
				return
			}
			// assumes questions is already a JSON string
			questions = JSON.parse(questions)

			//strip id from all imported questions and answers to avoid collisions
			questions.forEach((question) => {
				if (question.answers && question.answers.length > 0) {
					question.answers.forEach((answer) => {
						answer.id = null
					})
				}
				question.id = null
			})

			return sendToCreator('onQuestionImportComplete', [questions])
		},

		// Exposed to the media importer screen
		onMediaImportComplete(media) {
			hideEmbedDialog()

			if (media !== null) {
				// convert the sparce array that was converted into an object back to an array (ie9, you SUCK)
				const anArray = []
				for (let element of Array.from(media)) {
					anArray.push(element)
				}
				return sendToCreator('onMediaImportComplete', [anArray])
			}
		},

		// When a qset is selected from the prior saves list
		onQsetHistorySelectionComplete(qset, version = 1) {
			hideEmbedDialog()

			if (!qset) return false

			// request a save from the widget to grab the current qset state
			// passing 'history' as the save mode short-circuits the save functionality so a new save isn't actually made in the database
			_requestSave('history')

			// use initExistingWidget to apply the selected qset
			qsetToReload = {
				data: JSON.parse(qset),
				version: version,
			}
			sendToCreator('reloadCreator')

			$scope.showActionBar = false
			$scope.showRollbackConfirmBar = true
		},
	}

	// expose to scope

	$scope.saveStatus = 'idle'
	$scope.saveText = 'Save Draft'
	$scope.previewText = 'Preview'
	$scope.publishText = 'Publish...'
	$scope.canPublish = false
	$scope.invalid = false
	$scope.modal = false
	$scope.requestSave = _requestSave
	$scope.showQuestionImporter = _showQuestionImporter
	$scope.showQsetHistoryImporter = _showQsetHistoryImporter
	$scope.showQsetHistoryConfirmation = _showQsetHistoryConfirmation
	$scope.onPublishPressed = _onPublishPressed
	$scope.cancelPublish = _cancelPublish
	$scope.cancelPreview = _cancelPreview

	$scope.rollbackConfirmation = _qsetRollbackConfirmation
	$scope.showRollbackConfirmBar = false

	// initialize

	// get the instance_id from the url if needed
	if (window.location.hash) {
		inst_id = window.location.hash.substr(1)
	}
	widget_id = window.location.href.match(/widgets\/([\d]+)/)[1]

	if (inst_id) {
		// load an existing widget
		getQset().then(() => {
			if (!$scope.invalid) {
				$q((resolve) => resolve(inst_id))
					.then(WidgetSrv.lockWidget)
					.then(WidgetSrv.getWidget)
					.then(checkUserPublishPerms)
					.then(embed)
					.then(initCreator)
					.then(showButtons)
					.then(startHeartBeat)
					.catch(onInitFail)
			}
		})
	} else {
		// initialize a new creator
		$q((resolve) => resolve(widget_id))
			.then(WidgetSrv.getWidgetInfo)
			.then(prePublishPermsCheck)
			.then(embed)
			.then(initCreator)
			.then(showButtons)
			.then(startHeartBeat)
			.catch(onInitFail)
	}
})
