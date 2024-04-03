import React, { useState, useEffect } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionSetHistory } from '../util/api'
import './question-history.scss'
import useImportQset from './hooks/useImportQset'
import useToast from './hooks/useToast'
import useExportType from './hooks/useExportType'

const getInstId = () => {
	const l = document.location.href
	const id = l.substring(l.lastIndexOf('=') + 1)
	return id
}

const QuestionHistory = () => {
	const [saves, setSaves] = useState([])
	const [instId, setInstId] = useState(getInstId())
	const importQset = useImportQset()
	const exportType = useExportType()
	const { toast, toastRender } = useToast()

	const { data: qsetHistory, isLoading: loading } = useQuery({
		queryKey: ['questions', instId],
		queryFn: () => apiGetQuestionSetHistory(instId),
		enabled: !!instId,
		staleTime: Infinity
	})

	useEffect(() => {
		if (qsetHistory && qsetHistory.type != 'error')
		{
			qsetHistory.map((qset) => {
				return {
					id: qset.id,
					data: qset.data,
					version: qset.version,
					count: readQuestionCount(qset.data),
					created_at: new Date(parseInt(qset.created_at) * 1000).toLocaleString(),
				}
			})
			setSaves(qsetHistory)
		}
	}, [qsetHistory])

	const exportClickHandler = (timestamp) => {
		exportType('qset', instId, onExportFailure, timestamp)
	}

	const importClickHandler = () => {
		importQset(instId, onImportSuccess, onImportFailure)
	}

	const onImportSuccess = (inst) => {
		const qset = inst.qset
		window.parent.Materia.Creator.onQsetHistorySelectionComplete(
			JSON.stringify(qset.data),
			qset.version,
			qset.created_at
		)
	}

	const onImportFailure = (err) => {
		toast('Import Failed: There was an error importing the question set.', false, true)
	}

	const onExportFailure = (err) => {
		toast('Export Failed: There was an error exporting the question set.', false, true)
	}

	const readQuestionCount = (qset) => {
		let items = qset.items
		if (items.items) items = items.items

		return items.length
	}

	const loadSaveData = (id) => {
		if (!!saves) {
			saves.forEach((save) => {
				if (id == save.id) {
					return window.parent.Materia.Creator.onQsetHistorySelectionComplete(
						JSON.stringify(save.data),
						save.version,
						save.created_at
					)
				}
			})
		}
	}

	const closeDialog = () => window.parent.Materia.Creator.onQsetHistorySelectionComplete(null)

	let savesRender = null
	let noSavesRender = null
	if (!!saves && saves.length > 0) {
		savesRender = saves.map((save, index) => {
			return (
				<tr key={index}>
					<td title="Select" onClick={() => loadSaveData(save.id)}>Save #{saves.length - index}</td>
					<td title="Select" onClick={() => loadSaveData(save.id)} >{new Date(parseInt(save.created_at) * 1000).toLocaleString()}</td>
					<td className='export' title="Export" onClick={() => exportClickHandler(save.created_at)}>
						<span className="export-icon"></span>
					</td>
				</tr>
			)
		})
	} else {
		noSavesRender = (
			<div className="no_saves">
				<h3>No previous saves for this widget.</h3>
				If you publish or a save a draft of your widget and then come back, you can view and restore previous saves from here.
			</div>
		)
	}

	let bodyRender = (
		<div>
			<form id="import_form">
				<div className="header">
					<h1>Manage Saves</h1>
					<a id="import_button" href="#" onClick={importClickHandler}>Import New</a>
				</div>
				<table id="qset_table" width="100%">
					<thead width="100%">
						<tr>
							<th>Save Count</th>
							<th>Saved At</th>
							<th>Export</th>
						</tr>
					</thead>
					<tbody>
					 { savesRender }
					</tbody>
				</table>
			</form>
			{ noSavesRender }
			<div className="actions">
				<a id="cancel_button" href="#" onClick={closeDialog}>Cancel</a>
			</div>

			{ toastRender }
		</div>
	)

	return (
		<>
			{ bodyRender }
		</>
	)
}

export default QuestionHistory
