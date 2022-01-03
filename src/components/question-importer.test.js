import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider, QueryCache, useQuery } from 'react-query'
import QuestionImporter from './question-importer';
import '@testing-library/jest-dom'

let rawQuestionIdIncrement = 100
const createRawQuestionObject = (text) => ({
	id: rawQuestionIdIncrement+=100,
	text: text,
	created_at: Math.floor(new Date().getTime()/1000) - Math.floor(Math.random()*1000000),
	type: 'QA',
	uses: Math.ceil(Math.random() * 10)
})

// Mocks the API call
jest.mock('react-query', () => ({
	...jest.requireActual('react-query'),
	useQuery: jest.fn(() => ({
		data: [
			createRawQuestionObject('a'),
			createRawQuestionObject('b'),
			createRawQuestionObject('c'),
			createRawQuestionObject('d'),
			createRawQuestionObject('e'),
			createRawQuestionObject('ab'),
			createRawQuestionObject('ac'),
			createRawQuestionObject('ad'),
			createRawQuestionObject('abb'),
			createRawQuestionObject('abc')
		],
		isLoading: false
	}))
}))

const renderWithClient = (children) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Turns retries off
				retry: false,
			},
		},
	})

	const { rerender, ...result } = render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)

	return {
		...result,
		rerender: (rerenderUi) =>
			rerender(<QueryClientProvider client={queryClient}>{rerenderUi}</QueryClientProvider>)
	}
}

describe('QuestionImporter', () => {
	beforeEach(() => {
		const div = document.createElement('div')
		div.setAttribute('id', 'modal')
		document.body.appendChild(div)
	})

	afterEach(() => {
		const div = document.getElementById('modal')
		if (div) {
			document.body.removeChild(div)
		}
	})

	it('Renders properly when loading questions from the API', () => {
		const rendered = renderWithClient(<QuestionImporter/>)

		// cool - now what?
	})
})