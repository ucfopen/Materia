import React, { useEffect, useRef, useCallback, useState} from 'react'
import { iconUrl } from '../util/icon-url'
import MyWidgetsScores from './my-widgets-scores'
import MyWidgetEmbedInfo from './my-widgets-embed'
import parseObjectToDateString from '../util/object-to-date-string'
import parseTime from '../util/parse-time'
import MyWidgetsCollaborateDialog from './my-widgets-collaborate-dialog'
import MyWidgetsCopyDialog from './my-widgets-copy-dialog'
import MyWidgetsExportDataDialog from './my-widgets-export-data-dialog'
import MyWidgetsWarningDialog from './my-widgets-warning-dialog'
import MyWidgetsSettingsDialog from './my-widgets-settings-dialog'
import fetchOptions from '../util/fetch-options'

const fetchEdit = (arrayOfWidgetIds) => fetch('/api/json/widget_instance_edit_perms_verify', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfWidgetIds]))}`}))

const convertAvailibilityDates = (startDateInt, endDateInt) => {
	let endDate, endTime, open_at, startTime
	startDateInt = ~~startDateInt
	endDateInt = ~~endDateInt
	endDate = endTime = 0
	open_at = startTime = 0

	if (endDateInt > 0) {
		endDate = parseObjectToDateString(endDateInt)
		endTime = parseTime(endDateInt)
	}

	if (startDateInt > 0) {
		open_at = parseObjectToDateString(startDateInt)
		startTime = parseTime(startDateInt)
	}

	return {
		start: {
			date: open_at,
			time: startTime,
		},
		end: {
			date: endDate,
			time: endTime,
		},
	}
}

const MyWidgetSelectedInstance = ({ inst = {}, currentUser, myPerms, otherUserPerms, setOtherUserPerms, onDelete, onCopy}) => {
	const attempts = parseInt(inst.attempts, 10)
	const [perms, setPerms] = useState({})
	const [can, setCan] = useState({})
	const [playUrl, setPlayUrl] = useState("")
	const shareLinkRef = useRef(null)

	useEffect(() => {
		const inp = shareLinkRef.current
		console.log(inst)

		// Disables highlighting the play link if it is a draft
		if (inst.is_draft) {
			const regex = /preview/i
			let new_url = inst.preview_url.replace(regex, 'play')
			if (!new_url)
				new_url = ""

			setPlayUrl(new_url)
		}
		else {
			setPlayUrl(inst.play_url)
		}

	}, [inst])

	useEffect(() => {
		if (myPerms) {
			console.log(myPerms)
			setCan(myPerms.can)
			setPerms(myPerms)
		}
	}, [myPerms, inst])

	const onEditClick = (inst) => {

		if (inst.widget.is_editable) {
			fetchEdit(inst.id)
			.then(res => res.json())
			.then(widgetInfo => {
				console.log(widgetInfo)

				if(widgetInfo.isLocked){
					return 'This widget is currently locked, you will be able to edit this widget when it is no longer being edited by somebody else.'
				}
				if(inst.isDraft){
					const editUrl = `http://localhost/${inst.widget.dir}/create#${inst.id}`
					window.location = editUrl
					return
				}

				if (widgetInfo.can_publish){
					// show editPublished warning
					showModal(setShowWarning)
					return
				}
				else {
					// show restricted publish warning
					return
				}
			})
			.catch(error => {
				console.log(error)
			})
		}
	}

	const onShowCollaboration = () => {}
	
	const onPopup = () => {
		if (can.edit && can.share && !inst.is_draft) {
			showModal(setShowSettings)
		}
	}

	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showEmbed, setShowEmbed] = useState(false)
	const [showCopy, setShowCopy] = useState(false)
	const [showCollab, setShowCollab] = useState(false)
	const [showExport, setShowExport] = useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [showSettings, setShowSettings] = useState(false)


	const makeCopy = useCallback(
		(title, copyPermissions) => {
			setShowCopy(false)
			onCopy(inst.id, title, copyPermissions)
		}, [inst, setShowCopy]
	)

	const closeModal = (setModal) => {
		if (setModal != undefined) {
			setModal(false)
			document.body.style.overflow = "auto"
		}
	}

	const showModal = (setModal) => {
		if (setModal != undefined) {
			setModal(true)
			document.body.style.overflow = "hidden"
		}
	}

	const editWidget = () => {
		const editUrl = `http://localhost/widgets/${inst.widget.dir}create#${inst.id}`
		window.location = editUrl
	}

	useEffect(() => {
		setShowDeleteDialog(false);
	}, [inst])

	const availability = convertAvailibilityDates(inst.open_at, inst.close_at)
	const availabilityStart = inst.open_at
	const availabilityEnd = inst.close_at
	let availabilityMode
	if (inst.close_at < 0 && inst.open_at < 0) {
		availabilityMode = 'anytime'
	} else if (inst.open_at < 0 && inst.close_at > 0) {
		availabilityMode = 'open until'
	} else if (inst.open_at > 0 && inst.close_at < 0) {
		availabilityMode = 'anytime after'
	} else {
		availabilityMode = 'from'
	}

	return (
		<section className="page">
			<div className="header">
				<h1>{inst.name} Widget</h1>
			</div>
			<div className="overview">
				<div className={`icon_container med_${inst.beard} ${inst.beard ? 'big_bearded' : ''}`} >
					<img className="icon"
						src={iconUrl('http://localhost/widget/', inst.widget.dir, 275)}
						height="275px"
						width="275px"
						alt={inst.widget.name} />
				</div>
				<div className="controls">
					<ul className="button-list">
						<li className="preview_holder">
							<a id="preview_button"
								className={`action-button green ${ !inst.widget.is_playable ? 'disabled' : '' }`}
								target="_blank"
								href={inst.preview_url}
							>
								<svg className="preview-svg" viewBox="-40 32 155 70" width="125">
									<path d="M 108 44 H 11 a 30 30 90 1 0 0 45 H 108 C 110 89 111 88 111 86 V 47 C 111 45 110 44 108 44" stroke="#525252"/>
									<polyline points="-15 51.5 -15 81.5 5 66.5" fill="#4c5823"/>
									<span className="">Preview</span>
								</svg>
								<span className="">Preview</span>
							</a>
						</li>
						<li>
							<a id="edit_button"
								className={`action-button aux_button ${can.edit ? '' : 'disabled'} `}
								onClick={() => {onEditClick(inst)}}>
								<span className="pencil"></span>
								Edit Widget
							</a>
						</li>
					</ul>
					<ul className="options">
						<li className="share">
							<div className={`link ${perms.stale ? 'disabled' : ''}`}
								onClick={() => {
									showModal(setShowCollab)
								}}
							>
								Collaborate { otherUserPerms && otherUserPerms.size > 1 ? "(" +(otherUserPerms.size-1) + ")" : "" }
							</div>
						</li>
						<li className={`copy ${can.copy ? '' : 'disabled'}`}>
							<div className={`link ${can.copy ? '' : 'disabled'}`}
								id="copy_widget_link"
								onClick={() => {showModal(setShowCopy)}}
							>
								Make a Copy
							</div>
						</li>
						<li className={`delete ${can.delete ? '' : 'disabled'}`}>
							<div className={`link ${can.delete ? '' : 'disabled'}`}
								id="delete_widget_link"
								onClick={() => {setShowDeleteDialog(!showDeleteDialog)}}
							>
								Delete
							</div>
						</li>
					</ul>

					{showDeleteDialog
						? <div className="delete_dialogue">
							<span className="delete-warning">Are you sure you want to delete this widget?</span>
							<div className="bottom_buttons">
								<a
									className="cancel_button"
									href="#"
									onClick={() => {setShowDeleteDialog(false)}}
								>
									Cancel
								</a>
								<a
									className="action_button red delete_button"
									href="#"
									onClick={() => {onDelete(inst)}}
								>
									Delete
								</a>
							</div>
						</div>
						: null
					}

					<div className={`additional_options ${!can.share || inst.is_draft ? 'disabled' : '' }`}>
						<h3>Settings:</h3>
						<dl className={`attempts_parent ${!can.share || inst.is_draft ? 'disabled' : ''}`}>
							<dt>Attempts:</dt>
							<dd
								className={`num-attempts ${!can.edit || !can.share || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								{ attempts > 0 ? attempts : 'Unlimited' }
							</dd>
							<dt>Available:</dt>
							<dd
								className={`availability-time ${!can.share || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								{availabilityMode == "anytime"
									? <span>Anytime</span>
									: null
								}

								{availabilityMode == "open until"
									? <span className="open-until">
											<span>Open until</span>
											<span className="available-date">{ availability.end.date }</span>
											<span>at</span>
											<span className="available-time">{ availability.end.time }</span>
										</span>
									: null
								}

								{availabilityMode == "anytime after"
									? <span className="available-after">
											<span>Anytime after</span>
											<span className="available_date">{ availability.start.date }</span>
											<span>at</span>
											<span className="available_time">{ availability.start.time }</span>
										</span>
									: null
								}

								{availabilityMode == "from"
									? <span className="available-from">
											<span>From</span>
											<span className="available_date">{ availability.start.date }</span>
											<span>at</span>
											<span className="available_time">{ availability.start.time }</span>
											<span>until</span>
											<span className="available_date">{ availability.end.date }</span>
											<span>at</span>
											<span className="available_time">{ availability.end.time }</span>
										</span>
									: null
								}
							</dd>
							<dt>Access:</dt>
							<dd
								className={`access-level ${!can.share || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								<span>
									{inst.guest_access ? 'Guest Mode - No Login Required' : 'Staff and Students only'}
								</span>

							</dd>
						</dl>
						<a id="edit-availability-button"
							role="button"
							className={!can.share || inst.is_draft ? 'disabled' : ''}
							disabled={!can.share || inst.is_draft}
							onClick={onPopup}
						>
							Edit settings...
						</a>
					</div>

				</div>

				<div className={`share-widget-container closed ${inst.is_draft ? 'draft' : ''}`}>
					<h3>
						{inst.is_draft ? "Publish to share" : "Share"} with your students
						<a href="https://ucfopen.github.io/Materia-Docs/create/assigning-widgets.html"
							target="_blank">
							View all sharing options.
						</a>
					</h3>
					<div onMouseDown={(e)=>{ if (inst.is_draft) e.preventDefault() }}>
						<input ref={shareLinkRef}
							className={`play_link ${inst.is_draft ? 'disabled' : ''}`}
							type="text"
							readOnly
							disabled={inst.is_draft}
							value={playUrl}
						/>
					</div>
					<p>
						Use this link to share with your students (or
						<span
							className="show-embed link"
							onClick={() => {setShowEmbed(!showEmbed)}}
						> use the embed code
						</span>
						).
					</p>

					{showEmbed
						? <MyWidgetEmbedInfo inst={inst} />
						: null
					}

				</div>
			</div>
			{showCopy
				? <MyWidgetsCopyDialog onClose={() => {closeModal(setShowCopy)}} name={inst.name} onCopy={makeCopy} />
				: null
			}
			{showCollab
				? <MyWidgetsCollaborateDialog currentUser={currentUser} inst={inst} myPerms={myPerms} otherUserPerms={otherUserPerms} setOtherUserPerms={setOtherUserPerms} onClose={() => {closeModal(setShowCollab)}} />
				: null
			}
			{showExport
				? <MyWidgetsExportDataDialog onClose={() => {setShowExport(false)}} />
				: null
			}
			{showWarning
				? <MyWidgetsWarningDialog onClose={() => {closeModal(setShowWarning)}} onEdit={editWidget} />
				: null
			}
			{showSettings
				? <MyWidgetsSettingsDialog onClose={() => {closeModal(setShowSettings)}} inst={inst} currentUser={currentUser} />
				: null
			}
			<MyWidgetsScores inst={inst} />
		</section>
	)
}

export default MyWidgetSelectedInstance
