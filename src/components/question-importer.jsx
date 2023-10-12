import React, { useState, useEffect, useRef } from 'react'

import { useQuery } from 'react-query'
import { apiGetQuestionsByType } from '../util/api'

import './question-importer.scss'

const initState = () => {
	return {
		allQuestions: [], // all available questions
		displayQuestions: null, // questions matching an optionally provided filter
		filterValue: '',
		sortProperty: null,
		sortAscending: null
	}
}

const QuestionImporter = () => {
	const [state, setState] = useState(initState())
	const tableRef = useRef(null)

	const { data: allQuestions, isLoading } = useQuery({
		queryKey: 'questions',
		queryFn: () => apiGetQuestionsByType(null, _getType()),
		enabled: state.displayQuestions == null,
		staleTime: Infinity
	})

	useEffect(() => {
		if ( ! isLoading) {
			// add a 'selected' property with a default value of false to each question
			const formattedAllQuestions = allQuestions.map(q => ({...q, selected: false}))
			setState({...state, allQuestions: formattedAllQuestions, displayQuestions: formattedAllQuestions})
		}
	}, [isLoading])

	// reset displayQuestions whenever question selection, filter, or sort column/direction change
	useEffect(() => {
		// don't run any of this if there are no questions to do anything with
		if ( ! state.allQuestions || ! state.allQuestions.length) return
		const newDisplayQuestions = state.allQuestions.filter(q => q.text.includes(state.filterValue))

		if(state.sortProperty) {
			newDisplayQuestions.sort((a, b) => {
				if(state.sortAscending) {
					return a[state.sortProperty] > b[state.sortProperty] ? 1 : -1
				} else {
					return a[state.sortProperty] < b[state.sortProperty] ? 1 : -1
				}
			})
		}

		setState({...state, displayQuestions: newDisplayQuestions})
	}, [state.filterValue, state.allQuestions, state.sortProperty, state.sortAscending])

	const filterValueChangeHandler = e => {
		if (e.target.value != state.filterValue) setState({...state, filterValue: e.target.value})
	}

	const questionClickHandler = e => {
		const questionId = e.currentTarget.dataset.id
		const newAllQuestions = [...state.allQuestions]
		newAllQuestions.forEach(q => {
			if(q.id == questionId) q.selected = !q.selected
		})
		setState({...state, allQuestions: newAllQuestions})
	}

	const _getType = () => {
		const l = document.location.href
		const type = l.substring(l.lastIndexOf('=') + 1)
		return type
	}

	const renderHeading = (headingText, property) => {
		let sortRender = null
		if (state.sortProperty == property) {
			sortRender = (
				<span className={state.sortAscending ? 'sort-asc' : 'sort-desc'}></span>
			)
		}

		return (
			<th onClick={() => handleHeadingClick(property)}>
				{headingText}
				{sortRender}
			</th>
		)
	}

	const handleHeadingClick = property => {
		const newSortAscending = property == state.sortProperty ? !state.sortAscending : true

		setState({...state, sortProperty: property, sortAscending: newSortAscending})
	}

	const renderDisplayableRows = () => {
		if ( ! state.displayQuestions || ! state.displayQuestions.length ) {
			let message = 'Loading...'

			if (state.displayQuestions !== null) {
				message = !state.allQuestions.length ? 'No questions available' : 'No questions matching filter'
			}

			return (
				<tr>
					<td className='loading'
						colSpan={4}>
						{message}
					</td>
				</tr>
			)
		}

		return state.displayQuestions.map(question => {
			const d = new Date(question.created_at * 1000)
			const dateString = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
			return (
				<tr key={`question-${question.id}`}
					data-id={question.id}
					onClick={questionClickHandler}>
					<td>
						<input type="checkbox"
							name="id"
							checked={question.selected}
							readOnly={true}
							value={question.id}/>
						<span className="q">{question.text}</span>
					</td>
					<td>{question.type}</td>
					<td>{dateString}</td>
					<td>{question.uses} times</td>
				</tr>
			)
		})
	}

	const close = () => window.parent.Materia.Creator.onQuestionImportComplete(null)

	const loadSelectedQuestions = e => {
		e.stopPropagation()

		// map a NodeList to an array so we can map it
		const selectedQuestionIds = [...tableRef.current.querySelectorAll(':checked')].map(input => input.value)
		apiGetQuestionsByType(selectedQuestionIds).then(result => {
			if (result != null && !('msg' in result) && result.length > 0) {
				window.parent.Materia.Creator.onQuestionImportComplete(JSON.stringify(result))
			}
		})
	}

	let showingRender = null
	if (state.allQuestions?.length > 0) {
		const showingText = state.filterValue ? `${state.displayQuestions.length} / ${state.allQuestions.length}` : state.allQuestions.length
		showingRender = <span className='showing-text'>Showing: {showingText}</span>
	}

	return (
		<div id='question-importer'>
			<div className='header'>
				<h1>Question Catalog</h1>
				{ showingRender }
				<span>
					<label>Filter:</label>
					<input type='search' value={state.filterValue}
						onChange={filterValueChangeHandler}/>
				</span>
			</div>
			<div className='table-container'>
				<table id='question-table' ref={tableRef}>
					<thead>
					<tr>
						{renderHeading('Question Text', 'text')}
						{renderHeading('Type', 'type')}
						{renderHeading('Date', 'created_at')}
						{renderHeading('Used', 'uses')}
					</tr>
					</thead>
					<tbody>
						{renderDisplayableRows()}
					</tbody>
				</table>
			</div>
			<div className='actions'>
				<span id='cancel-button' onClick={close}>Cancel</span>
				<input onClick={loadSelectedQuestions}
					id='submit-button'
					className='action_button'
					type='button'
					value='Import Selected'>
				</input>
			</div>
		</div>
	)
}

export default QuestionImporter
