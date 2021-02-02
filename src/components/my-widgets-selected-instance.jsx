import React, { useEffect, useMemo, useCallback, useState} from 'react'
import { iconUrl } from '../util/icon-url'
import MyWidgetsScores from './my-widgets-scores'
import MyWidgetEmbedInfo from './my-widgets-embed'
import parseObjectToDateString from '../util/object-to-date-string'
import parseTime from '../util/parse-time'
import MyWidgetsCollaborateDialog from './my-widgets-collaborate-dialog'
import MyWidgetsCopyDialog from './my-widgets-copy-dialog'
import MyWidgetsExportDataDialog  from './my-widgets-export-data-dialog'

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
	// const collaborateCount = useMemo(
	// 	() => {
	// 		return 0
	// 	},
	// 	[inst]
	// )
	const perms = {}
	const can = {
		copy: true,
		delete: true
	}

	const onEditClick = (inst) => {

		const editUrl = `http://localhost/widgets/${inst.widget.dir}create#${inst.id}`
		window.location = editUrl

		// if(inst.editable){
		// 	// send request to widget_instance_edit_perms_verify
		// 	// Materia.Coms.Json.send('widget_instance_edit_perms_verify', [inst.id,])
		// 	// .then((response) => {
		// 	if(isLocked){
		// 		return 'This widget is currently locked, you will be able to edit this widget when it is no longer being edited by somebody else.'
		// 	}

		// 	if(isDraft){
		// 		const editUrl = `http://localhost/${inst.widget.dir}/create#${inst.id}`
		// 		window.location = editUrl
		// 		return
		// 	}

		// 	if (response.can_publish){
		// 		// show editPublished warning
		// 		// $scope.show.editPublishedWarning = true
		// 		return
		// 	}
		// 	else{
		// 		// show restricted publish warning
		// 		// $scope.show.restrictedPublishWarning = true
		// 		return
		// 	}
		// }
	}

	const onShowCollaboration = () => {}
	const onPopup = () => {}

	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showEmbed, setShowEmbed] = useState(false)
	const [showCopy, setShowCopy] = useState(false)
	const [showCollab, setShowCollab] = useState(false)
	const [showExport, setShowExport] = useState(false)


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
					<ul>
						<li>
							<a id="preview_button"
								className={`action_button green circle_button ${ !inst.widget.is_playable ? 'disabled' : '' }`}
								target="_blank"
								href={inst.preview_url}
							>
								<span className="arrow arrow_right"></span>Preview
							</a>
						</li>
						<li>
							<a id="edit_button"
								className={`action_button aux_button ${inst.widget.is_editable ? '' : 'disabled'} `}
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

					<div className={`additional_options ${!inst.sharable || inst.is_draft ? 'disabled' : '' }`}>
						<h3>Settings:</h3>
						<dl className={`attempts_parent ${!inst.starable || inst.is_draft ? 'disabled' : ''}`}>
							<dt>Attempts:</dt>
							<dd
								className={`num-attempts ${!inst.editable || !inst.shareable || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								{ attempts > 0 ? attempts : 'Unlimited' }
							</dd>
							<dt>Available:</dt>
							<dd
								className={`availability-time ${!inst.shareable || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								{availabilityMode == "anytime"
									? <span>Anytime</span>
									: null
								}

								{availabilityMode == "open until"
									? <span>
											Open until
											<span className="available_date">{ availability.end.date }</span>
											at
											<span className="available_time">{ availability.end.time }</span>
										</span>
									: null
								}

								{availabilityMode == "anytime after"
									? <span>
											Anytime after
											<span className="available_date">{ availability.start.date }</span>
											at
											<span className="available_time">{ availability.start.time }</span>
										</span>
									: null
								}

								{availabilityMode == "from"
									? <span>
											From
											<span className="available_date">{ availability.start.date }</span>
											at
											<span className="available_time">{ availability.start.time }</span>
											until
											<span className="available_date">{ availability.end.date }</span>
											at
											<span className="available_time">{ availability.end.time }</span>
										</span>
									: null
								}
							</dd>
							<dt>Access:</dt>
							<dd
								className={`access-level ${!inst.sharable || inst.is_draft ? 'disabled' : ''}`}
								onClick={onPopup}
							>
								<span>
									{inst.guest_access ? 'Guest Mode - No Login Required' : 'Staff and Students only'}
								</span>

							</dd>
						</dl>
						<a id="edit-availability-button"
							role="button"
							className={!inst.shareable || inst.is_draft ? 'disabled' : ''}
							disabled={!inst.shareable || inst.is_draft}
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
					<input id="play_link"
						type="text"
						disabled={inst.is_draft}
						readOnly
						value={inst.play_url}
					/>
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
				? <MyWidgetsCopyDialog onClose={() => {closeModal(setShowCopy)}} onCopy={makeCopy} />
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
			<MyWidgetsScores inst={inst} />
		</section>
	)
}

export default MyWidgetSelectedInstance
