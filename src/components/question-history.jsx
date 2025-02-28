import React, { useState, useEffect } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionSetHistory } from '../util/api'
import './question-history.scss'

const getInstId = () => {
	const l = document.location.href
	const id = l.substring(l.lastIndexOf('=') + 1)
	return id
}

const QuestionHistory = () => {
	const [saves, setSaves] = useState([])
	const [error, setError] = useState('')
	const [instId, setInstId] = useState(getInstId())

	const { data: qsetHistory, isLoading: loading } = useQuery({
		queryKey: ['questions', instId],
		queryFn: () => apiGetQuestionSetHistory(instId),
		enabled: !!instId,
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			setError("Error fetching question set history.")
			console.error(err.cause)
		}
	})

	useEffect(() => {
		if (qsetHistory)
		{
			qsetHistory.map((qset) => {
				return {
					id: qset.id,
					data: qset.data,
					version: qset.version,
					count: readQuestionCount(qset.data),
					created_at: new Date(qset.created_at).toLocaleString(),
				}
			})
			setSaves(qsetHistory)
		}
	}, [qsetHistory])

	const readQuestionCount = (qset) => {
		let items = qset
		// recursively get qset.items
		if (items.items)
			return readQuestionCount(items.items)

		return items.length
	}

	const loadSaveData = (id) => {
		if (!!saves) {
			saves.forEach((save) => {
				if (id == save.id) {
					return window.parent.Materia.Creator.onQsetReselectionComplete(
						JSON.stringify(save.data),
						false, // is generated
						save.version,
						null
					)
				}
			})
		}
	}

	const closeDialog = () => window.parent.Materia.Creator.onQsetReselectionComplete(null)

	let savesRender = null
	let noSavesRender = null
	if (loading) {
		noSavesRender = (
			<div className="no_saves">
				<h3>Loading...</h3>
			</div>
		)
	}
	else if (error) {
		noSavesRender = (
			<div className="no_saves">
				<h3><i>{error}</i></h3>
			</div>
		)
	}
	else if (!!saves && saves.length > 0) {
		savesRender = saves.map((save, index) => {
			return (
				<tr onClick={() => loadSaveData(save.id)} key={index}>
					<td>Save #{saves.length - index}</td>
					<td>{new Date(save.created_at).toLocaleString()}</td>
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
				<h1>Save History</h1>
				<table id="qset_table" width="100%">
					<thead width="100%">
						<tr>
							<th>Save Count</th>
							<th>Saved At</th>
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
		</div>
	)

	return (
		<>
			{ bodyRender }
		</>
	)
}

export default QuestionHistory
