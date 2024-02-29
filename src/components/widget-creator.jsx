import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query'
import LoadingIcon from './loading-icon';
import { apiGetWidgetInstance, apiGetQuestionSet, apiCanBePublishedByCurrentUser, apiSaveWidget, apiGetWidgetLock, apiGetWidget, apiAuthorVerify} from '../util/api'
import NoPermission from './no-permission'
import Alert from './alert'
import { creator } from './materia-constants';

const WidgetCreator = ({instId, widgetId, minHeight='', minWidth=''}) => {

	/* =========== state information =========== */

	// state information about the widget instance
	const [instance, setInstance] = useState({
		id: instId,
		qset: null,
		is_draft: true,
		widget: null,
		editable: true
	})

	// state information about the creator
	const [creatorState, setCreatorState] = useState({
		mode: 'edit', // 'edit' is for new or draft widgets; 'update' is for existing widgets
		invalid: false,
		creatorPath: null,
		dialogPath: null,
		dialogType: 'embed_dialog',
		hearbeatEnabled: true,
		hasCreatorGuide: false,
		creatorGuideUrl: window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/creators-guide',
		showActionBar: true,
		showRollbackConfirm: false,
		saveStatus: 'idle',
		saveMode: null,
		previewUrl: null,
		saveText: 'Save Draft',
		publishText: 'Publish...',
		popupState: null,
		returnUrl: null,
		returnLocation: 'Widget Catalog',
		directUploadMediaFile: null
	})

	const [alertDialog, setAlertDialog] = useState({
		enabled: false,
		message: '',
		title: 'Failure',
		fatal: false,
		enableLoginButton: false
	})

	const [sinceLastSave, setSinceLastSave] = useState({
		lastSaved: null,
		elapsed: 0
	})
	const [saveWidgetComplete, setSaveWidgetComplete] = useState(null)
	const [widgetReady, setWidgetReady] = useState(false)

	const instIdRef = useRef(instId)
	const creatorShouldInitRef = useRef(true) // this value is stored as a ref because of race conditions preventing it being used in state
	const saveModeRef = useRef(null)
	const frameRef = useRef(null)

	/* =========== react queries =========== */

	// load widget info (NOT instance info)
	// requires: widgetId prop (always set)
	const { isLoading: widgetInfoIsLoading } = useQuery({
		queryKey: ['widget', widgetId],
		queryFn: () => apiGetWidget(widgetId),
		enabled: !!widgetId,
		staleTime: Infinity,
		onSettled: (info) => {
			if (info) {
				setInstance({ ...instance, widget: info })
			}
		}
	})

	// load instance info
	// requires: instId prop (may be null, for new widgets)
	const { isLoading: instanceIsLoading } = useQuery({
		queryKey: ['widget-inst', instId],
		queryFn: () => apiGetWidgetInstance(instId),
		enabled: !!instId,
		staleTime: Infinity,
		onSettled: (data) => {
			// this value will include a qset that's always empty
			// it will override the instance's qset property even if it's already set
			// remove it so the existing qset data isn't overwritten
			if (data.qset) delete data.qset
			setInstance({ ...instance, ...data })
		}
	})

	// load question set (qset) for given instance id
	// requires: instance.id state property to be set (widget instance query is settled)
	const { isLoading: qSetIsLoading, data: qset } = useQuery({
		queryKey: ['qset', instId],
		queryFn: () => apiGetQuestionSet(instId),
		staleTime: Infinity,
		placeholderData: null,
		enabled: !!instance.id, // requires instance state object to be prepopulated
		onSettled: (data) => {
			if ( (data != null ? data.title : undefined) === 'Permission Denied' || (data && data.title === 'error')) {
				setCreatorState({...creatorState, invalid: true})
				onInitFail('Permission Denied')
			} else {
				setCreatorState({...creatorState, invalid: false})
				setInstance({ ...instance, qset: data })
			}
		}
	})

	// verify user can publish a given instance
	// requires: instance.widget is set (value is determined by widget type and user perms)
	const { data: canPublish } = useQuery({
		queryKey: ['can-publish', instance.id],
		queryFn: () => apiCanBePublishedByCurrentUser(instance.widget?.id),
		enabled: instance?.widget !== null,
		staleTime: Infinity,
		onSettled: (success) => {
			if (!success && !instance.is_draft) {
				onInitFail('Widget type can not be edited by students after publishing.')
			}
		}
	})

	useQuery({
		queryKey: 'heartbeat',
		queryFn: () => apiAuthorVerify(),
		staleTime: 30000,
		refetchInterval: 30000,
		enabled: creatorState.hearbeatEnabled,
		onSettled: (valid) => {
			if (!valid) {
				setCreatorState({...creatorState, hearbeatEnabled: false})
				setAlertDialog({ enabled: true, title: 'Invalid Login', message:'You are no longer logged in, please login again to continue.', fatal: true, enableLoginButton: true })
			}
		}
	})

	// if this is an existing instance, check lock status
	// requires: instance.id state value is set
	useQuery({
		queryKey: ['widget-lock', instance.id],
		queryFn: () => apiGetWidgetLock(instance.id),
		enabled: !!instance.id,
		staleTime: Infinity,
		onSettled: (success) => {
				if (!success) {
					onInitFail('Someone else is editing this widget, you will be able to edit after they finish.')
				}
		}
	})

	/* =========== hooks =========== */

	// helper function to update the time elapsed since last save
	// displayed after selecting Preview or Save Draft (both of which trigger a save)
	const updateElapsed = () => {
		setSinceLastSave(sinceLastSave => {
			if (sinceLastSave.lastSave == null) return { ...sinceLastSave }
			const duration = Math.floor((Date.now() - sinceLastSave.lastSave)/(60 * 1000))
			return {...sinceLastSave, elapsed: duration}
		})
	}

	// configures interval to update sinceLastSaved elapsed time
	useEffect(() => {
		const intervalId = setInterval(updateElapsed, 30000)
		return () => clearInterval(intervalId)
	},[])

	// manually update elapsed time if lastSave is set to a new value
	useEffect(() => {
		if (creatorState.lastSave) updateElapsed()
	},[creatorState.lastSave])

	// the listener is applied (and reapplied) when the widget is ready
	useEffect(() => {
		// setup the postmessage listener
		window.addEventListener('message', onPostMessage, false)

		// cleanup this listener
		return () => {
			window.removeEventListener('message', onPostMessage, false)
		}
	},[widgetReady])

	useEffect(() => {

		if (instance.id) {
			instIdRef.current = instance.id
			setCreatorState({
				...creatorState,
				publishText: !instance.is_draft ? 'Update' : 'Publish...',
				mode: !instance.is_draft ? 'update' : 'edit',
				returnUrl: getMyWidgetsUrl(instance.id),
				returnLocation: 'My Widgets'
			})
		} else {
			setCreatorState({...creatorState, returnUrl: `${window.BASE_URL}widgets`, returnLocation: 'Widget Catalog'})
		}

	}, [instance])

	useEffect(() => {
		if (instance.widget) {
			let creatorPath = instance.widget.creator.substring(0, 4) === 'http' ? instance.widget.creator : window.WIDGET_URL + instance.widget.dir + instance.widget.creator

			setCreatorState({
				...creatorState,
				creatorPath: creatorPath + '?' + instance.widget.created_at,
				hasCreatorGuide: instance.widget.creator_guide != ''
			})
		}
	}, [instance.widget])

	// this hook actually initializes the creator with relevant instance data
	// the type of initialization depends on several conditions
	// normally, we're either initializing a new widget, or an existing one is being edited
	useEffect(() => {
		if (creatorShouldInitRef.current && widgetReady) {

			// we have a qset to reload manually (for qset history), ask creator to reload
			// this hook will then fire a second time when a new save postMessage is sent
			// the second hook will initialize an existing widget with the newly provided qset data
			// note: this condition will also apply when rolling back and applying the original cached qset
			if (!!instId && instance.qset && creatorState.reloadWithQset) {

				// flip to false because creator will re-init and send start postMessage
				setWidgetReady(false)
				// remove reloadWithQset property now that it's loaded into instance.qset
				setCreatorState({
					...creatorState,
					reloadWithQset: null
				})
				// tell creator to manually reload
				sendToCreator('reloadCreator')

			} else if (!!instId && instance.qset) {

				let args = [instance.name, instance, instance.qset.data, instance.qset.version, window.BASE_URL, window.MEDIA_URL]
				sendToCreator('initExistingWidget', args)

				creatorShouldInitRef.current = false

			} else if (!instId) {

				let args = [instance.widget, window.BASE_URL, window.MEDIA_URL]
				sendToCreator('initNewWidget', args)

				creatorShouldInitRef.current = false
			}
		}

	}, [widgetReady, instance.qset])

	useEffect(() => {
		if (!!creatorState.reloadWithQset) {
			creatorShouldInitRef.current = true
			setInstance({
				...instance,
				qset: creatorState.reloadWithQset
			})
		}
	},[creatorState.reloadWithQset])

	// setting creatorState within the API response callback can result in race conditions
	// saveWidgetComplete is set instead to defer the creatorState updates
	useEffect(() => {
		if (!!saveWidgetComplete) {
			if (saveWidgetComplete == 'save') {
				setCreatorState(creatorState => ({...creatorState, saveText: 'Draft Saved', saveStatus: 'idle'}))
			}
			else if (saveWidgetComplete == 'preview') {
				setCreatorState(creatorState => ({...creatorState, saveStatus: 'idle'}))
			}
			setSinceLastSave({ lastSave: Date.now(), elapsed: 0 })
			setSaveWidgetComplete(null)
		}
	},[saveWidgetComplete])

	/* =========== postMessage handlers =========== */

	const onPostMessage = (e) => {
		const origin = `${e.origin}/`
		if (origin === window.STATIC_CROSSDOMAIN || origin === window.BASE_URL) {
			if (typeof e.data !== 'string' || !e.data) return
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
							if (creatorState.directUploadMediaFile) return e.source.postMessage(creatorState.directUploadMediaFile, e.origin)
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
							return setHeight(`${msg.data[0]}px`)
						case 'alert':
							return () => { setAlertDialog({ enabled: true, title: msg.data.title, message: msg.data.msg, fatal: msg.data.fatal, enableLoginButton: false }) }   // _alert(msg.data.msg, msg.data.title, msg.data.fatal)
						default:
							return console.warn(`Unknown message from creator: ${msg.type}`)
					}
			}
		}

		console.warn(`Unknown message from creator: ${origin}`)
	}

	const onCreatorReady = () => {
		setWidgetReady(true)
	}

	const requestSave = (mode) => {
		// TODO setPopUp (the publish/update message)
		saveModeRef.current = mode
		switch (mode) {
			case 'publish':
				setCreatorState({
					...creatorState,
					popupState: null,
					saveMode: mode,
					saveStatus: 'saving'
				})
				break
			case 'save':
				setCreatorState({
					...creatorState,
					popupState: null,
					saveMode: mode,
					saveStatus: 'saving',
					saveText: 'Saving...'
				})
				break
		}
		sendToCreator('onRequestSave', [mode])
	}

	const save = (instanceName, qset, version = 1) => {
		let newWidget = {
			widget_id: widgetId,
			name: instanceName,
			qset: { version, data: qset },
			is_draft: saveModeRef.current !== 'publish',
			inst_id: instIdRef.current,
		}

		// requested the current qset from the creator to cache for qset history rollback
		// since the qset is all we need, no need to save to the DB
		if (saveModeRef.current == 'history') {
			setCreatorState(currentState => ({...currentState, cachedQset: {data: qset, version}}))
			return false
		}

		apiSaveWidget(newWidget).then((inst) => {
			if ((inst != null ? inst.msg : undefined) != null) {
				setAlertDialog({...alertDialog, fatal: inst.halt, enabled: true})
			} else if (inst != null && inst.id != null) {
				if (String(instIdRef.current).length !== 0) {
					window.location.hash = `#${inst.id}`
				}
				switch (saveModeRef.current) {
					case 'preview':
						var url = `${window.BASE_URL}preview/${inst.id}`
						var popup = window.open(url)
						setInstance(currentInstance => ({ ...currentInstance, id: inst.id }))
						instIdRef.current = inst.id
						if (popup != null) {
							setTimeout(() => {
								if (!(popup.innerHeight > 0)) {
									return onPreviewPopupBlocked(url)
								}
							}, 200)
						} else {
							onPreviewPopupBlocked(url)
						}
						setSaveWidgetComplete(saveModeRef.current)
						break
					case 'publish':
						window.location = getMyWidgetsUrl(inst.id)
						break
					case 'save':
						setSaveWidgetComplete(saveModeRef.current)
						setInstance(currentInstance => ({ ...currentInstance, ...inst }))
						sendToCreator('onSaveComplete', [
							inst.name,
							inst.widget,
							inst.qset.data,
							inst.qset.version
						])
						break
				}
			}
		})
	}

	const onSaveCanceled = (msg) => {
		if (msg != null && msg != undefined) {
			if (msg.halt != null) {

				setAlertDialog({
					enabled: true,
					title: 'Invalid Login',
					message: `Unfortunately, your progress was not saved because ${msg.msg.toLowerCase()}. Any unsaved progress will be lost.`,
					fatal: true,
					enableLoginButton: true
				})

				setCreatorState({...creatorState, heartbeatEnabled: false})
			} else {
				setAlertDialog({
					enabled: true,
					title: 'Hold on a sec',
					message: `Your progress was not saved because: ${msg}`,
					fatal: false,
					enableLoginButton: false
				})
			}
		} else {
			setAlertDialog({
				enabled: true,
				title: 'Something went wrong',
				message: `Your progress was not saved, but no message was provided from the widget creator. If the problem persists, contact support.`,
				fatal: false,
				enableLoginButton: false
			})
		}
	}

	const onPreviewPopupBlocked = (url) => {
		setCreatorState({...creatorState, popupState: 'blocked', previewUrl: url })
	}

	const cancelPopup = () => {
		setCreatorState({...creatorState, popupState: null})
	}

	const showEmbedDialog = (url, type = 'embed_dialog') => {
		setCreatorState({...creatorState, dialogPath: url, dialogType: type})
	}

	const hideEmbedDialog = () => {
		setCreatorState({...creatorState, dialogPath: '', dialogType: 'embed_dialog'})
	}

	const showQuestionImporter = () => {
		const types = instance.widget.meta_data.supported_data
		showEmbedDialog(`${window.BASE_URL}questions/import/?type=${encodeURIComponent(types.join())}`)
	}

	const showQsetHistoryImporter = () => {
		showEmbedDialog(`${window.BASE_URL}qsets/import/?inst_id=${instance.id}`, 'embed_dialog')
	}

	// const showQsetHistoryConfirmation = () => {
	// }

	const qsetRollbackConfirm = (confirm) => {

		// if asked to confirm rollback, we apply the cached qset to reloadWithQset
		// doing so will trigger the hook when reloadWithQset updates
		// that hook will apply the cached qset and trigger the reload process

		// otherwise, nothing is required except to restore the action bar
		if (!confirm) {
			let qsetToApply = creatorState.cachedQset
			setCreatorState({
				...creatorState,
				reloadWithQset: qsetToApply,
				cachedQset: null,
				showActionBar: true,
				showRollbackConfirm: false
			})
		} else {
			setCreatorState({
				...creatorState,
				cachedQset: null,
				showActionBar: true,
				showRollbackConfirm: false
			})
		}
	}

	const showMediaImporter = (types) => {
		showEmbedDialog(`${window.BASE_URL}media/import#${types.join(',')}`)
	}

	const directUploadMedia = (media) => {
		// showMediaImporter(['jpg', 'gif', 'png', 'mp3'])
		setCreatorState({
			...creatorState,
			dialogPath: `${window.BASE_URL}media/import#${['jpg', 'gif', 'png', 'mp3'].join(',')}`,
			directUploadMedia: media
		})
	}

	const setHeight = (height) => {
		// *crickets*
	}

	/* =========== public window methods =========== */

	// Exposed to the window object so that popups and frames can use this public functions
	window.Materia = {
		Creator: {
			// Exposed to the question importer screen
			onQuestionImportComplete(questions) {
				hideEmbedDialog()
				if (!questions) {
					return
				}
				// // assumes questions is already a JSON string
				questions = JSON.parse(questions)

				questions = questions.map((question) => {
					question.answers?.map((answer) => {
						return {
							...answer,
							id: null
						}
					})

					return {
						...question,
						id: null
					}
				})

				sendToCreator('onQuestionImportComplete', [questions])
			},

			// Exposed to the media importer screen
			onMediaImportComplete(media) {
				hideEmbedDialog()

				if (media !== null) {
					// the original implementation of this section was manually reassigning the media array into a new array in order to bypass some weird ie9 behavior
					// ie9 is long since dead, so hopefully that behavior is no longer necessary
					return sendToCreator('onMediaImportComplete', [media])
				}
			},

			// When a qset is selected from the prior saves list
			onQsetHistorySelectionComplete(qset, version = 1) {
				if (!qset) {
					setCreatorState({
						...creatorState,
						dialogPath: '',
						dialogType: 'embed_dialog',
						showActionBar: true,
						showRollbackConfirm: false
					})
				} else {

					requestSave('history')

					let parsedQsetData = JSON.parse(qset)

					setCreatorState({
						...creatorState,
						dialogPath: '',
						dialogType: 'embed_dialog',
						reloadWithQset: {
							data: parsedQsetData,
							version: version,
							id: parsedQsetData.id
						},
						// cachedQset: instance.qset,
						showActionBar: false,
						showRollbackConfirm: true
					})
				}
			},
		}
	}

	/* =========== helper functions =========== */

	const getMyWidgetsUrl = (instId) => `${window.BASE_URL}my-widgets#${instId}`

	// Send messages to the creator
	const sendToCreator = (type, args) => {
		return frameRef.current.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			window.STATIC_CROSSDOMAIN
		)
	}

	const onInitFail = (message) => {
		setCreatorState({
			...creatorState,
			invalid: true
		})
		setAlertDialog({ enabled: true, title: 'Failure', message: message, fatal: true, enableLoginButton: true })
	}

	const onPublishPressed = () => {
		if (instance != null && instance.id != null && !instance.is_draft) {
			// Show the Update Dialog
			setCreatorState({ ...creatorState, popupState: 'update'})
		} else {
			// Show the Publish Dialog
			setCreatorState({ ...creatorState, popupState: 'publish'})
		}
	}

	/* =========== conditional renders =========== */

	let loadingRender = null
	if (widgetInfoIsLoading || instanceIsLoading) {
		loadingRender = (
			<LoadingIcon size='lrg'/>
		)
	}

	let alertDialogRender = null
	if (alertDialog.enabled) {
		alertDialogRender = (
			<Alert
				msg={alertDialog.message}
				title={alertDialog.title}
				fatal={alertDialog.fatal}
				showLoginButton={alertDialog.enableLoginButton}
				onCloseCallback={() => {
					setAlertDialog({...alertDialog, enabled: false})
				}} />
		)
	}

	let noPermissionRender = null
	if (creatorState.invalid) {
		noPermissionRender = <NoPermission />
	}

	let lastSavedRender = null
	if (sinceLastSave.lastSave) {
		lastSavedRender = (
			<span className="lastSaved">
				{sinceLastSave.elapsed < 1 ? ' Last saved < 1m ago' : `Last saved ${sinceLastSave.elapsed}m ago`}
				<div className="dot"></div>
			</span>
		)
	}

	let editButtonsRender = null
	if (creatorState.mode == 'edit' && instance.editable) {
		editButtonsRender = (
			<span>
				{lastSavedRender}
				<button id="creatorPreviewBtn" className="edit_button orange" type="button" onClick={()=>requestSave('preview')}><span>Preview</span></button>
				<button id="creatorSaveBtn" className={`edit_button orange ${creatorState.saveStatus}`} type="button" onClick={()=>requestSave('save')}><span>{creatorState.saveText}</span></button>
			</span>
		)
	}


	let actionBarRender = null
	if (creatorState.showActionBar) {

		let returnLocationUrl = creatorState.returnLocation == 'Widget Catalog' ? '/widgets' : '/my-widgets#' + instance.id

		actionBarRender = (
			<section id='action-bar'>
				<a id="returnLink" href={returnLocationUrl}>&larr;Return to {creatorState.returnLocation}</a>
				{ creatorState.hasCreatorGuide ? <a id="creatorGuideLink" href={creatorState.creatorGuideUrl} target="_blank">Creator's Guide</a> : '' }
				{ instance.id ? <a id="saveHistoryLink" onClick={showQsetHistoryImporter}>Save History</a> : '' }
				<a id="importLink" onClick={showQuestionImporter}>Import Questions...</a>
				{ editButtonsRender }
				<div className="dot"></div>
				<button id="creatorPublishBtn"
					className="edit_button green"
					type="button"
					onClick={onPublishPressed}>
					{creatorState.publishText}
				</button>
			</section>
		)
	}

	let rollbackConfirmBarRender = null
	if (creatorState.showRollbackConfirm) {
		rollbackConfirmBarRender = (
			<section id="qset-rollback-confirmation-bar">
				<h3>Previewing Prior Save</h3>
				<p>Select <span>Cancel</span> to go back to the version you were working on. Select <span>Keep</span> to commit to using this version.</p>
				<button onClick={() => qsetRollbackConfirm(false)}>Cancel</button>
				<button onClick={() => qsetRollbackConfirm(true)}>Keep</button>
			</section>
		)
	}

	let popupRender = <div className='popup'></div>
	switch(creatorState.popupState) {
		case 'blocked':
			popupRender = (
				<div className="popup preview show">
					<p>Your browser blocked the preview popup, click below to preview the widget.</p>
					<div className="publish_container">
						<a className="cancel_button" onClick={cancelPopup}>Close</a>
						<a href={creatorState.previewUrl} target="_blank" onClick={cancelPopup} className="action_button green">Open Preview</a>
					</div>
				</div>
			)
			break;
		case 'update':
			popupRender = (
				<div className="popup publish show">
					<header>Update Widget</header>
					<p>Updating this published widget will instantly allow your students to see your changes.</p>

					<div className="publish_container">
						<a className="cancel_button" onClick={cancelPopup}>Cancel</a>
						<a className="action_button green" onClick={() => requestSave('publish')}>Yes, Save Updates</a>
					</div>
				</div>
			)
			break;
		case 'publish':
			if (canPublish) {
				popupRender = (
					<div className="popup publish show">
						<header>Ready to Publish?</header>
						<p>Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores &amp; data.</p>
						<div className="publish_container">
							<a className="cancel_button" onClick={cancelPopup}>Cancel</a>
							<a className="action_button green" onClick={() => requestSave('publish')}>Yes, Publish</a>
						</div>
					</div>
				)
			}
			else {
				popupRender = (
					<div className="popup publish show">
						<header>Publish Restricted</header>
						<p>Students are not allowed to publish this widget.</p>
						<p>You can share the widget with a non-student who can publish it for you. Select "Save Draft" and add a non-student as a collaborator on the My Widgets page.</p>

						<div className="publish_container">
							<a className="cancel_button" onClick={cancelPopup}>Cancel</a>
						</div>
					</div>
				)
			}
			break;
	}

	return (
		<div>
			<section className={`page ${widgetInfoIsLoading ? 'loading' : ''}`}>
				{ alertDialogRender }
				{ popupRender }
				{ actionBarRender }
				{ rollbackConfirmBarRender }
				<div className="center">
					<iframe
						src={creatorState.creatorPath}
						id='container'
						className='html'
						scrolling='yes'
						style={{
							minWidth: minWidth + 'px',
							minHeight: minHeight + 'px'
						}}
						ref={frameRef} />
						{ loadingRender }
				</div>
				<iframe src={ creatorState.dialogPath } className={ creatorState.dialogPath ? 'show' : 'hidden' } id={creatorState.dialogType} frameBorder={0} width={675} height={500}></iframe>
			</section>
			{ noPermissionRender }
		</div>
	)

}

export default WidgetCreator