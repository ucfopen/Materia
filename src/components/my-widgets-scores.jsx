import React, { useState, useEffect, useMemo } from 'react'
import BarGraph from './bar-graph'

const MyWidgetScoreSemesterTable = ({semester}) => {
	return (
		<div score-table
			className="display table"
			id={`table_${semester.id}`}
			data-term={semester.term}
			data-year={semester.year}
		>
			<div className="score-search">
				<input
					type="text"
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
	)
}

const MyWidgetScoreSemesterStorage = ({semester}) => {
	return (
		<div
			score-data id="data_{{semester.id}}"
			className="display data"
			data-semester="{{semester.year}} {{semester.term.toLowerCase()}}"
			data-has-storage="{{ semester.storage ? true : false }}"
			ng-if="selectedScoreView[$index] == SCORE_TAB_STORAGE"
		>
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
	)
}

const MyWidgetScoreSemester = ({semester}) => {
	const [scoreTab, setScoreTab] = useState('SCORE_GRAPH_TAB')

	const activeTab = useMemo(() => {
			switch(scoreTab){
				case 'SCORE_GRAPH_TAB':
					return (
						<div className="display graph">
							<BarGraph data={semester.graphData} width="530" height="300" />
						</div>
					)

				case 'SCORE_STORAGE_TAB':
					return <MyWidgetScoreSemesterTable semester={semester} />

				case 'SCORE_STORAGE_TAB':
					return <MyWidgetScoreSemesterStorage semester={semester}/>
			}
		}, [scoreTab, semester]
	)

	return (
		<div key={semester} className="scoreWrapper">
			<h3 className="view">{semester.term} {semester.year}</h3>
			<ul className="choices">
				<li className={scoreTab == 'SCORE_GRAPH_TAB' ? 'scoreTypeSelected' : ''}>
					<a className="graph" onClick={() => {setScoreTab('SCORE_GRAPH_TAB')}}>
						Graph
					</a>
				</li>
				<li className={scoreTab == 'SCORE_TABLE_TAB' ? 'scoreTypeSelected' : ''}>
					<a className="table" onClick={() => {setScoreTab('SCORE_TAB_INDIVIDUAL')}}>
						Individual Scores
					</a>
				</li>
				<li className={scoreTab == 'SCORE_STORAGE_TAB' ? 'scoreTypeSelected' : ''}>
					<a className="data" onClick={() => {setScoreTab('SCORE_TAB_STORAGE')}}>
						Data
					</a>
				</li>
			</ul>

			{activeTab}

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
		</div>
	)
}


const MyWidgetsScores = ({inst}) => {
	const [scores, setScores] = useState([])
	const [isShowingAll, setIsShowingAll] = useState(false)
	const [isLoadingScores, setIsLoadingScores] = useState(true)
	useEffect(
		() => {
			setIsLoadingScores(true)

			// getScores
			const options = {
				"headers": {
				"cache-control": "no-cache",
				"pragma": "no-cache",
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8"
				},
				"body": `data=%5B%22${inst.id}%22%2C${true}%5D`,
				"method": "POST",
				"mode": "cors",
				"credentials": "include"
			}

			fetch('/api/json/score_summary_get/', options)
				.then(resp => {
					if(resp.ok && resp.status !== 204) return resp.json()
					return []
				})
				.then(scores => {
					const ranges = [
						"0-9",
						"10-19",
						"20-29",
						"30-39",
						"40-49",
						"50-59",
						"60-69",
						"70-79",
						"80-89",
						"90-100",
					]
					scores.forEach(semester => {
						semester.graphData = semester.distribution.map((d, i) => ({ label: ranges[i], value: d }) )
						semester.totalScores = semester.distribution.reduce((total, count) => total+count)
					})

					setScores(scores)
					setIsLoadingScores(false)
				})
		}, [inst.id]
	)


	const displayedScores = isShowingAll
		? scores
		: scores.slice(0,1) // gracefully handles empty array

	return (
		<div className="scores">
			<h2>Student Activity</h2>
			<span
				id="export_scores_button"
				className={`action_button aux_button ${scores.length ? '' : 'disabled'}`}
			>
				<span className="arrow_down"></span>
				Export Options
			</span>
			{displayedScores.map(semester => <MyWidgetScoreSemester semester={semester} />)}
			{scores.length > 0 && !isShowingAll
				?	<a role="button"
						className="show-older-scores-button"
						onClick={() => setIsShowingAll(true)}
					>

						Show older scores...
					</a>
				: null
			}

		</div>
	)
}

export default MyWidgetsScores
