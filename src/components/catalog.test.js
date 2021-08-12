import React from 'react';
import { render, screen, fireEvent, getByPlaceholderText, queryByTestId, queryByText } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import Catalog from './catalog.jsx'
import '@testing-library/jest-dom'

const getWidgets = () => ([
	{
		clean_name: "adventure",
		creator: "creator.html",
		created_at: "1621453611",
		dir: "9-adventure/",
		flash_version: "0",
		api_version: "2",
		height: "593",
		id: "9",
		is_answer_encrypted: "1",
		in_catalog: "1",
		is_editable: "1",
		is_playable: "1",
		is_qset_encrypted: "1",
		is_scalable: "0",
		is_scorable: "1",
		is_storage_enabled: "0",
		package_hash: "a7c66b6458007cc2f9467cef1f49d489",
		meta_data: {
			features: ["Customizable", "Scorable", "Media"],
			supported_data: ["Question/Answer", "Multiple Choice"],
			excerpt: "Build branching scenarios where your student's choices lead them down different paths.",
			about: "An advanced flexible scenario-building tool.",
			playdata_exporters: ["Survey Formatting"],
			demo: "hFLbU",
			accessibility_keyboard: "Full",
			accessibility_reader: "Full"
		},
		name: "Adventure",
		player: "player.html",
		question_types: "",
		restrict_publish: "0",
		score_module: "Adventure",
		score_screen: "",
		width: "800",
		creator_guide: "guides/creator.html",
		player_guide: "guides/player.html"
	},
	{
		clean_name: "crossword",
		creator: "creator.html",
		created_at: "1621453531",
		dir: "1-crossword/",
		flash_version: "10",
		api_version: "2",
		height: "592",
		id: "1",
		is_answer_encrypted: "1",
		in_catalog: "1",
		is_editable: "1",
		is_playable: "1",
		is_qset_encrypted: "1",
		is_scalable: "0",
		is_scorable: "1",
		is_storage_enabled: "0",
		package_hash: "c07c389f1316d9a97ce51c6598495e0a",
		meta_data: {
			features: ["Customizable", "Scorable", "Mobile Friendly"],
			supported_data: ["Question/Answer"],
			excerpt: "A quiz tool that uses words and clues to randomly generate a crossword puzzle.",
			about: "In Crossword, fill in the blank squares with: (a) words based on the clues provided in the text and/or (b) by the letters overlapping from other words.",
			playdata_exporters: ["Survey Formatting"],
			demo: "y4Cye",
			accessibility_keyboard: "Full",
			accessibility_reader: "Limited"
		},
		name: "Crossword",
		player: "player.html",
		question_types: "",
		restrict_publish: "0",
		score_module: "Crossword",
		score_screen: "scoreScreen.html",
		width: "715",
		creator_guide: "guides/creator.html",
		player_guide: "guides/player.html"
	},
	// Doesn't have accessibility options
	{
		clean_name: "evaluate-a-rejection-letter",
		creator: "creator.html",
		created_at: "1614365891",
		dir: "14-evaluate-a-rejection-letter/",
		flash_version: "0",
		api_version: "2",
		height: "600",
		id: "14",
		is_answer_encrypted: "1",
		in_catalog: "0",
		is_editable: "0",
		is_playable: "1",
		is_qset_encrypted: "1",
		is_scalable: "0",
		is_scorable: "1",
		is_storage_enabled: "1",
		package_hash: "c633f75b879274559c7fbf444461ce20",
		meta_data: {
			features: ["Scorable", "Storage"],
			supported_data: [],
			excerpt: "Students read a rejection letter and answer questions about their response. They are directed to put themselves in the place of the individual being rejected, with some background context about their life situation.",
			about: "A Widget in the UCF Psychology POPUP Series. Students read a rejection letter and answer questions about their response. They are directed to put themselves in the place of the individual being rejected, with some background context about their life situation.",
			playdata_exporters: ["Survey Formatting"],
			demo: "wllxI",
		},
		name: "Evaluate a Rejection Letter",
		player: "player.html",
		question_types: "",
		restrict_publish: "0",
		score_module: "EvaluateaRejectionLetter",
		score_screen: "",
		width: "800",
		creator_guide: "",
		player_guide: "",
	},
])

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

// Jest's official way to mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false, // returned val
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
})

describe('Catalog', () => {

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

	it.only('renders correctly', async () => {
		const rendered = renderWithClient(<Catalog widgets={getWidgets()} isLoading={false} />)

		// Waits for data to load
		//await screen.findAllByText('Test_Student_One Test_Lastname_One')

		expect(screen.queryByText('Adventure')).not.toBeNull()
		expect(screen.queryByText('Crossword')).not.toBeNull()
		expect(screen.queryByText('Evaluate a Rejection Letter')).not.toBeNull()

		// Gets widget card filters and not filter buttons in filter drawer
		expect(screen.getAllByRole('listitem', {
			name: /Customizable/i,
		}).length).toBe(2)

		// Only Adventure and Crossword should be featured
		expect(screen.getByTestId('featured-widgets').children.length).toBe(2)

		// Only one non featured widgets
		expect(screen.getByTestId('non-featured-widgets').children.length).toBe(1)

		// features: ["Customizable", "Scorable", "Media"],
		// supported_data: ["Question/Answer", "Multiple Choice"],
		// Screen reader accessible & Keyboard accessible
		// Mobile friendly

		// Only should be filter by feature button
		expect(screen.getAllByRole('button').length).toBe(1)

		// Opens widget filter box
		fireEvent.click(screen.getByRole('button', { name: /Filter by feature/i }))

		// Should have Clear filter button and 9 other filter buttons
		expect(screen.getAllByRole('button').length).toBe(10)
	})

	it('renders with no widgets', async () => {
		const rendered = renderWithClient(<Catalog widgets={[]} isLoading={false} />)

		expect(screen.getByText(/No Widgets Installed/i)).not.toBeNull()

		// No widgets should be installed
		expect(screen.queryByTestId('featured-widgets')).toBeNull()
		expect(screen.queryByTestId('non-featured-widgets').children.length).toBe(0)

		// Only should be filter by feature button
		expect(screen.getAllByRole('button').length).toBe(1)

		// Opens widget filter box
		fireEvent.click(screen.getByRole('button', { name: /Filter by feature/i }))

		// Should only have the Clear filter button
		expect(screen.getAllByRole('button').length).toBe(1)
	})

	it.todo('should properly filter widgets')

	it.todo('should highlight filter tag')

	it.todo('should highlight accessibility icon')

	it.todo('should display show all button')

	test.todo('clicking show all button should show all widgets')

	it.todo('should show all widgets and close filter box when filters are cleared')

	it.todo('search input should filter widgets')

})