import React, { useState, useEffect, useRef } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionsByType } from '../util/api'

import './question-importer.scss'

const initState = () => {
	return {
		allQuestions: [], // all available questions
		displayQuestions: [], // questions matching an optionally provided filter
		filterValue: ''
	}
}

const QuestionImporter = () => {
	const [state, setState] = useState(initState())
	const tableRef = useRef(null)

	const { data: allQuestions, isLoading } = useQuery({
		queryKey: 'questions',
		queryFn: () => apiGetQuestionsByType(null, _getType()),
		staleTime: Infinity
	})

	useEffect(() => {
		if(allQuestions && allQuestions.length) {
			setState({...state, allQuestions: allQuestions, displayQuestions: allQuestions})
		}
	}, [allQuestions?.length])

	const _getType = () => {
		const l = document.location.href
		const type = l.substring(l.lastIndexOf('=') + 1)
		return type
	}

	const close = e => {
		e.stopPropagation()
		window.parent.Materia.Creator.onQuestionImportComplete(null)
	}

	const renderDisplayableRows = () => {
		if ( state.allQuestions.length < 1) return (
			<tr className='loading'>
				<td colSpan={4}>
					Loading Available Questions...
				</td>
			</tr>
		)

		return state.displayQuestions.map(question => {
			const d = new Date(question.created_at * 1000)
			const dateString = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
			return (
				<tr key={`question-${question.id}`}>
					<td>
						<input type="checkbox" name="id" value={question.id} />
						<span className="q">{question.text}</span>
					</td>
					<td>{question.type}</td>
					<td>{dateString}</td>
					<td>{question.uses} times</td>
				</tr>
			)
		})
	}

	const loadSelectedQuestions = e => {
		e.stopPropagation()

		// map a NodeList to an array so we can map it
		const selectedQuestionIds = [...tableRef.current.querySelectorAll(':checked')].map(input => input.value)
		console.log(selectedQuestionIds)
	}

	return (
		<>
			<div id='question-importer'>
				<div className='header'>
					<h1>Question Catalog</h1>
				</div>
				<div className='table-container'>
					<table id='question-table' ref={tableRef}>
						<thead>
							<tr>
								<th>Question Text</th>
								<th>Type</th>
								<th>Date</th>
								<th>Used</th>
							</tr>
						</thead>
						<tbody>
						{
							renderDisplayableRows()
						}
						</tbody>
					</table>
				</div>
				<div className='actions'>
					<a id='cancel-button' href='#' onClick={close}>Cancel</a>
					<input onClick={loadSelectedQuestions}
						id='submit-button'
						className='action_button'
						type='button'
						value='Import Selected'>
					</input>
				</div>
			</div>
		</>
	)
}

export default QuestionImporter
