import React, { useState, useMemo } from 'react'
import ReactDOM from 'react-dom'
import Header from './header'
import './my-widgets-page.scss'
import MyWidgetsInstanceCard from './my-widgets-instance-card'
import MyWidgetsSideBar from './my-widgets-side-bar'
import parseObjectToDateString from '../util/object-to-date-string'
import parseTime from '../util/parse-time'
import { iconUrl } from '../util/icon-url'

const BASE_URL = 'http://localhost/'

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

const getEmbedLink = (inst, autoplayToggle = true) => {
	console.log('LINK', autoplayToggle)
	if (inst === null) {
		return ''
	}

	const width =
		String(inst.widget.width) !== '0'
			? inst.widget.width
			: 800

	const height =
		String(inst.widget.height) !== '0'
			? inst.widget.height
			: 600

	const draft = inst.is_draft
		? `${inst.widget.name} Widget`
		: inst.name


	return `<iframe src="${BASE_URL}embed/${inst.id}/${inst.clean_name}?autoplay=${autoplayToggle?'true':'false'}" width="${width}" height="${height}" style="margin:0;padding:0;border:0;"></iframe>`
}

const MyWidgetEmbedInfo = ({inst}) => {
	const [autoplay, setAutoplay] = useState(true)
	return (
		<div className="embed-options">
			<h3>Embed Code</h3>
			<p>Paste this HTML into a course page to embed.</p>
			<textarea id="embed_link" value={ getEmbedLink(inst, autoplay) }></textarea>
			<label htmlFor="embed-code-autoplay">Autoplay: </label>
			<input id="embed-code-autoplay"
				type="checkbox"
				className="unstyled"
				checked={autoplay}
				onChange={() => {setAutoplay(!autoplay)}}
			/>
			{autoplay
				? <span>(widget starts automatically)</span>
				: <span>(widget starts after clicking play)</span>
			}
		</div>
	)
}

const MyWidgetSelectedInstance = ({ inst = {}, }) => {
	const attempts = parseInt(inst.attempts, 10)
	const collaborateCount = useMemo(
		() => {
			return 0
		},
		[inst]
	)
	const perms = {}
	const can = {
		copy: true,
		delete: true
	}

	const onEditClick = () => {}
	const onShowCollaboration = () => {}
	const onShowCopyDialog = () => {}
	const onDelete = () => {}
	const onPopup = () => {}

	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showEmbed, setShowEmbed] = useState(false)

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

	const scores = []

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
								href={inst.preview}
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
								onClick={() => {onShowCollaboration(inst)}}
							>
								Collaborate ({ collaborateCount })
							</div>
						</li>
						<li className={`copy ${can.copy ? '' : 'disabled'}`}>
							<div className={`link ${can.copy ? '' : 'disabled'}`}
								id="copy_widget_link"
								onClick={() => {onShowCopyDialog(inst)}}
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
						value={`${BASE_URL}play/${inst.id}/${inst.clean_name}`}
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

			<div className="scores">
				<h2>Student Activity</h2>
				<span id="export_scores_button"
					className={`action_button aux_button ${scores.length ? '' : 'disabled'}`}
					ng-click="selected.scores.list.length === NULL ? angular.noop() : exportPopup()">
					<span className="arrow_down"></span>
					Export Options
				</span>

			{scores.map(semester =>
				<div className="scoreWrapper"
					ng-if="show.olderScores == true || $index == 0">
					<h3 className="view">{semester.term} {semester.year}</h3>
					<ul className="choices">
						<li ng-className="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_TAB_GRAPH}">
							<a className="graph"
								ng-show="semester.distribution"
								ng-click="setScoreViewTab($index, SCORE_TAB_GRAPH)">
								Graph
							</a>
						</li>
						<li ng-className="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_TAB_INDIVIDUAL}">
							<a className="table"
								ng-show="semester.distribution"
								ng-click="setScoreViewTab($index, SCORE_TAB_INDIVIDUAL)">
								Individual Scores
							</a>
						</li>
						<li ng-className="{'scoreTypeSelected' : selectedScoreView[$index] == SCORE_TAB_STORAGE}">
							<a className="data"
								ng-show="semester.storage"
								ng-click="setScoreViewTab($index, SCORE_TAB_STORAGE)">
								Data
							</a>
						</li>
					</ul>
					<div score-table
						className="display table"
						id="table_{{semester.id}}"
						data-term="{{semester.term}}"
						data-year="{{semester.year}}"
						ng-if="selectedScoreView[$index] == SCORE_TAB_INDIVIDUAL">
						<div className="score-search">
							<input type="text"
								ng-model="studentSearch"
								ng-change="searchStudentActivity(studentSearch)"
								placeholder="Search Students" />
						</div>
						<h3>Select a student to view their scores.</h3>
						<div className="scoreListContainer">
							<div className="scoreListScrollContainer">
								<table className="scoreListTable">
									<tbody>
										<tr ng-repeat="user in users track by user.uid"
											id="{{$index}}"
											ng-className="{'rowSelected' : user.uid == selectedUser.uid}">
											<td className="listName"
												ng-click="setSelectedUser(user.uid)">
												{user.name}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div className="scoreTableContainer"
							ng-hide="selectedUser == null">
							<table className="scoreTable">
								<tbody>
									<tr ng-repeat="score in selectedUser.scores"
										ng-click="showScorePage(score.id)">
										<td>{ score.date.substring(0, 10) }</td>
										<td>{ score.complete == "1" ? score.percent + "%" : "---" }</td>
										<td>{ score.elapsed }</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
					<div className="display graph"
						ng-if="selectedScoreView[$index] == SCORE_TAB_GRAPH">
						<div score-graph
							className="chart"
							id="chart_{{semester.id}}">
						</div>
					</div>
					<div
						score-data id="data_{{semester.id}}"
						className="display data"
						data-semester="{{semester.year}} {{semester.term.toLowerCase()}}"
						data-has-storage="{{ semester.storage ? true : false }}"
						ng-if="selectedScoreView[$index] == SCORE_TAB_STORAGE">
						<div>
							<input type='checkbox'
								ng-model='semester.anonymize'
								ng-init='semester.anonymize=false' />
							Anonymize Download
							<a className="storage"
								ng-href="/data/export/{{inst.id}}?type=storage&amp;table={{selectedTable | escape}}&amp;semesters={{semester.year}}-{{semester.term}}&amp;anonymized={{semester.anonymize}}" >
								Download Table
							</a>
						</div>
						<div className="table label"
							ng-show="tableNames.length == 1">
							<h4>Table:
								<span>{ tableNames[0] }</span>
							</h4>
						</div>
						<select ng-model="selectedTable"
							ng-options="tableName as tableName for tableName in tableNames"
							ng-show="tableNames.length > 1">
						</select>
						<div ng-repeat="table in tables"
							ng-show="tableNames[$index] == selectedTable">
							<p ng-if="table.truncated"
								className="truncated-table">
								Showing only the first { MAX_ROWS } entries of this table.
								Download the table to see all entries.
							</p>
							<table className="storage_table"
								datatable>
								<thead>
									<tr>
										<th>user</th>
										<th>firstName</th>
										<th>lastName</th>
										<th>time</th>
										<th ng-repeat="(name, data) in table.data[0].data">{{name}}</th>
									</tr>
								</thead>
								<tbody>
									<tr ng-repeat="row in table.data">
										<td>{ row.play.user }</td>
										<td>{ row.play.firstName }</td>
										<td>{ row.play.lastName }</td>
										<td>{ row.play.cleanTime }</td>
										<td ng-repeat="rowData in row.data"
											ng-className="{'null':rowData == null}">
											{ rowData }
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
					<ul className="numeric"
						ng-show="selectedScoreView[$index] != SCORE_TAB_STORAGE">
						<li>
							<h4>Students</h4>
							<p className="players"
								className="playerShrink">
								{ semester.students }
							</p>
						</li>
						<li>
							<h4>Scores</h4>
							<p className="score-count">{ semester.totalScores }</p>
						</li>
						<li>
							<h4>Avg Final Score</h4>
							<p className="final-average">{ semester.average }</p>
						</li>
					</ul>
					<a role="button"
						className="show-older-scores-button"
						href="javascript:;"
						ng-show="selected.scores.list.length > 1 && show.olderScores == false && $index == 0"
						ng-click="enableOlderScores()">
						Show older scores...
					</a>
				</div>
			)}
			</div>
		</section>
	)
}


const MyWidgetsPage = ({widgets}) => {
	const [noAccess, setNoAccess] = useState(false)
	const [selectedInst, setSelectedInst] = useState(widgets[0])

	return (
		<>
			<Header />
			<div className="my_widgets">

				{widgets.length == 0
					? <div className="qtip top nowidgets">
							Click here to start making a new widget!
						</div>
					: null

				}

				<div className="container">
					<div>
						{noAccess
							? <section className="directions error">
								<div className="error error-nowidget">
									<p className="errorWindowPara">
										You do not have access to this widget or this widget does not exist.
									</p>
								</div>
							</section>
							: null
						}

						{widgets.length < 1 && !noAccess
							? <section className="directions no-widgets">
									<h1>You have no widgets!</h1>
									<p>Make a new widget in the widget catalog.</p>
								</section>
							: null
						}

						{widgets.length > 0 && !selectedInst && !noAccess
							? <section className="directions unchosen">
									<h1>Your Widgets</h1>
									<p>Choose a widget from the list on the left.</p>
								</section>
							: null
						}

						<MyWidgetSelectedInstance inst={selectedInst} />

					</div>

					<MyWidgetsSideBar
						instances={widgets}
						selectedId={selectedInst.id}
						onClick={setSelectedInst}
						Card={MyWidgetsInstanceCard}
					/>

				</div>
			</div>

		</>
	)
}

export default MyWidgetsPage
