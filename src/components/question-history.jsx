import React, { useState, useEffect } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionSetHistory } from '../util/api'
import './question-history.scss'
import useImportQset from './hooks/useImportQset'
import useToast from './hooks/useToast'
import useExportQset from './hooks/useExportQset'

const getInstId = () => {
	const l = document.location.href
	const id = l.substring(l.lastIndexOf('=') + 1)
	return id
}

const QuestionHistory = () => {
	const [saves, setSaves] = useState([])
	const [instId, setInstId] = useState(getInstId())
	const { importQset } = useImportQset()
	const { exportQset } = useExportQset()
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

	const exportClickHandler = (qsetId) => {
		exportQset.mutate({args: qsetId, errorFunc: onExportFailure})
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
					<td className='export' title="Export" onClick={() => exportClickHandler(save.id)}>
						<svg className="export-icon" viewBox="0 0 490.2 490.2">
							<path d="M341.1,34.3h90.5l-206.9,207c-6.7,6.7-6.7,17.6,0,24.3c3.3,3.3,7.7,5,12.1,5s8.8-1.7,12.1-5l207-207v90.5
							c0,9.5,7.7,17.2,17.1,17.2c9.5,0,17.2-7.7,17.2-17.2V17.2C490.2,7.7,482.5,0,473,0H341.1c-9.5,0-17.2,7.7-17.2,17.2
							C324,26.6,331.6,34.3,341.1,34.3z"/>
							<path d="M102.9,490.2h284.3c56.8,0,102.9-46.2,102.9-102.9V253.4c0-9.5-7.7-17.1-17.2-17.1s-17.1,7.7-17.1,17.1v133.8
							c0,37.8-30.8,68.6-68.6,68.6H102.9c-37.8,0-68.6-30.8-68.6-68.6V161.4V103c0-37.8,30.8-68.6,68.6-68.6h132.7
							c9.5,0,17.1-7.7,17.1-17.2S245,0,235.6,0H102.9C46.1,0,0,46.2,0,102.9v58.4v225.9C0,444,46.2,490.2,102.9,490.2z"/>
						</svg>
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
					<h1>Save History</h1>
					<a id="import_button" href="#" onClick={importClickHandler}>Import New</a>
				</div>
				<table id="qset_table" width="100%">
					<thead width="100%">
						<tr>
							<th>Save Count</th>
							<th>Saved At</th>
							<th></th>
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
