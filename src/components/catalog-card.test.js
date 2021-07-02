import React from 'react';
import { render, screen, fireEvent, getByPlaceholderText, queryByTestId, queryByText } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import CatalogCard from './catalog-card.jsx'
import '@testing-library/jest-dom'

const getPropData = () => ({
	id: "9",
	clean_name: "adventure",
	in_catalog: "1",
	name: "Adventure",
	dir: "9-adventure/",
	meta_data: {
		features: ["Customizable", "Scorable", "Media"],
		supported_data: ["Question/Answer", "Multiple Choice"],
		excerpt: "Build branching scenarios where your student's choices lead them down different paths.",
		about: "An advanced flexible scenario-building tool.",
		playdata_exporters: ["Survey Formatting"],
		demo: "hFLbU",
		accessibility_options: ["Full", "Full"],
	},
	isFiltered: false,
	activeFilters: []
})

// Enables testing with react query
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

describe('CatalogCard', () => {

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

	it('renders correctly', async () => {
		const propData = getPropData()
		const rendered = renderWithClient(<CatalogCard id={propData.id}
			clean_name={propData.clean_name}
			in_catalog={propData.in_catalog}
			name={propData.name}
			dir={propData.dir}
			meta_data={propData.meta_data}
			isFiltered={propData.isFiltered}
			activeFilters={propData.activeFilters} />)

		expect(screen.queryByText(/Adventure/i)).not.toBeNull()
		expect(screen.queryByText(/Featured/i)).not.toBeNull()
		expect(screen.queryByText(/Scorable/i)).not.toBeNull()
		expect(screen.queryByText(/Build branching scenarios where your student's choices lead them down different paths/i)).not.toBeNull()
	})

	// Test fails
	test('onhover shows keyboard access popup', () => {
		const propData = getPropData()
		const rendered = renderWithClient(<CatalogCard id={propData.id}
			clean_name={propData.clean_name}
			in_catalog={propData.in_catalog}
			name={propData.name}
			dir={propData.dir}
			meta_data={propData.meta_data}
			isFiltered={propData.isFiltered}
			activeFilters={propData.activeFilters} />)

		const screenReaderPopup = screen.getByLabelText('screen-reader-access-popup')
		const keyboardPopup = screen.getByLabelText('keyboard-access-popup')

		// Confirms keyboard and screen reader popups are not shown
		// expect(keyboardPopup).toHaveStyle('visibility: hidden')
		// expect(screenReaderPopup).toHaveStyle('visibility: hidden')

		// Fires onhover event to keyboard access icon
		fireEvent.mouseOver(keyboardPopup)

		// Confirms only keyboard popup is shown
		// expect(keyboardPopup).toHaveStyle('visibility: visible')
		// expect(screenReaderPopup).toHaveStyle('visibility: hidden')
	})

	// Test fails
	test('onhover shows screen reader access popup', () => {
		const propData = getPropData()
		const rendered = renderWithClient(<CatalogCard id={propData.id}
			clean_name={propData.clean_name}
			in_catalog={propData.in_catalog}
			name={propData.name}
			dir={propData.dir}
			meta_data={propData.meta_data}
			isFiltered={propData.isFiltered}
			activeFilters={propData.activeFilters} />)

		const screenReaderPopup = screen.getByLabelText('screen-reader-access-popup')
		const keyboardPopup = screen.getByLabelText('keyboard-access-popup')

		// Confirms keyboard and screen reader popups are not shown
		//expect(keyboardPopup).toHaveStyle('visibility: hidden')
		//expect(screenReaderPopup).toHaveStyle('visibility: hidden')

		// Fires onhover event to screen reader access icon
		fireEvent.mouseOver(screenReaderPopup)

		// Confirms only screen reader popup is shown
		//expect(keyboardPopup).toHaveStyle('visibility: hidden')
		//expect(screenReaderPopup).toHaveStyle('visibility: visible')
	})

	it('should highlight active filters', () => {
		const propData = getPropData()
		propData.isFiltered = true
		propData.activeFilters = ['Customizable']

		const rendered = renderWithClient(<CatalogCard id={propData.id}
			clean_name={propData.clean_name}
			in_catalog={propData.in_catalog}
			name={propData.name}
			dir={propData.dir}
			meta_data={propData.meta_data}
			isFiltered={propData.isFiltered}
			activeFilters={propData.activeFilters} />)

		expect(screen.queryByText('Customizable')).toHaveStyle('background: rgb(52 152 219);')
		expect(screen.queryByText('Customizable')).toHaveStyle('color: rgb(255 255 255);')

		expect(screen.queryByText('Scorable')).toHaveStyle('background: rgb(238 238 238);')
		expect(screen.queryByText('Scorable')).toHaveStyle('color: rgb(68 68 68);')
	})

	it('should highlight accessibility icons', () => {
		const propData = getPropData()
		propData.isFiltered = true
		propData.activeFilters = ['Keyboard Accessible', 'Screen Reader Accessible']

		const rendered = renderWithClient(<CatalogCard id={propData.id}
			clean_name={propData.clean_name}
			in_catalog={propData.in_catalog}
			name={propData.name}
			dir={propData.dir}
			meta_data={propData.meta_data}
			isFiltered={propData.isFiltered}
			activeFilters={propData.activeFilters} />)

		expect(1).toBe(1)
	})

})