/**
 * @jest-environment jsdom
 */

// Support page redirects to admin/user and admin/instances so this encompasses those basically

import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act } from 'react-dom/test-utils';
import { render, screen, cleanup, fireEvent, waitFor, prettyDOM } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from "@testing-library/user-event";

import instances from '../__test__/mockapi/widget_instances_get.json'

import SupportPage from './support-page'
import SupportSelectedInstance from './support-selected-instance'
import SupportSearch from './support-search'

import * as api from '../util/api'

jest.mock('../util/api')

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

describe('InstanceAdmin', () => {
	let rendered;
	let container;
	let mockApiSearchWidgets;

	beforeEach(() => {
		mockApiSearchWidgets = jest.spyOn(api, 'apiSearchWidgets').mockImplementation(async input => {
			let results = []

			instances.forEach(w => {
				// Search name and id
				if (w.name.toLowerCase().includes(input.toLowerCase())
				|| w.id.toLowerCase().includes(input.toLowerCase()))
				{
					results.push(w);
				}
				// Search created_at
				else if (Date.parse(input) == w.created_at*1000
				|| new Date(w.created_at*1000).toString().includes(input)
				|| new Date(w.created_at*1000).toLocaleDateString().includes(input))
				{
					results.push(w);
				}
			})

			return results;

			// Mocks delay
			// return new Promise((resolve) =>
			// {
			// 	setTimeout(() => resolve(results), 2000);
			// })

		});

		act(() => {

			rendered = renderWithClient(<SupportPage/>)

			container = rendered.container;
		})
	})

    afterEach(() => {
		cleanup();
		jest.clearAllMocks();
	})

    it('renders search page', () => {
		expect(container.querySelector(".support-page")).not.toBeNull();

		expect(container.querySelector(".instance_search")).not.toBeNull();
	})

	// Left timer code as comments just in case someone wants to attempt using fake timers
    it('returns no matches', async () => {
		let noMatchInput = "troll"

		// jest.useFakeTimers();

		// Input the search value
		let searchBar = screen.getByRole('textbox');
		userEvent.type(searchBar, noMatchInput);

		// Needed to tell jest we're going to be updating component state
		// act(() => {
		// 	jest.runOnlyPendingTimers()
		// });

		// Tests debouncing
		expect(screen.getByText("Searching Widget Instances ...")).not.toBeNull();

		// act(() => {
		// 	jest.advanceTimersByTime(1000);
		// });

		// For future reference: advancing timers won't update container, only screen

		await waitFor(() => {
			expect(screen.getByText("No widgets match your description")).toBeInTheDocument();
		})

		// Was the API function called?
		expect(mockApiSearchWidgets).toHaveBeenCalledTimes(1);


		// jest.clearAllTimers();
		// jest.useRealTimers();

	})

	it('returns single match by name', async () => {
		let input2 = "syntax"
		let widgetName1 = "Syntax Sorter"

		let searchBar = screen.getByRole('textbox');

		// Search for a single widget instance
		userEvent.type(searchBar, input2);

		expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText(widgetName1)).not.toBeNull();
		})
	})

	it('returns multiple matches by name', async () => {
		// Every instance name should have an "a" in it
		let input1 = "a"

		let searchBar = screen.getByRole('textbox');

		// Search for a single widget instance
		userEvent.type(searchBar, input1);

		expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		await waitFor(() => {
			instances.forEach((inst) => {
				if (!inst.is_deleted)
				{
					expect(screen.getAllByText(inst.name)).not.toBeNull();
				}
			})
		})
	})

    it('returns matches by id', async () => {
		let input1 = "qdJD6"
		let widgetName1 = "My Adventure Widget"

		let searchBar = screen.getByRole('textbox');
		userEvent.type(searchBar, input1);

		expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})
	})

	// This does not work in the app yet because apiSearchWidgets does not search by created at
    it('searches by created_at', async () => {
		let input1 = "3/21"
		let input2 = "2023"
		let input3 = "10:29 AM"
		let widgetName1 = "My Adventure Widget"

		let searchBar = screen.getByRole('textbox');

		// Search by Month and Day
		userEvent.type(searchBar, input1);

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})

		// Reset input
		fireEvent.change(container.querySelector('.instance_search', { target: { value: '' }}));

		// Search by Year
		userEvent.type(searchBar, input2);

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})

		// Reset input
		fireEvent.change(container.querySelector('.instance_search', { target: { value: '' }}));

		// Search by time
		userEvent.type(searchBar, input3);

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})
	})

	it('shows deleted instances', async() => {
		let input1 = "Cell"
		let widgetName1 = "Parts of a Cell"

		let showDeletedCheckbox = screen.getByRole('checkbox');

		userEvent.click(showDeletedCheckbox);

		let searchBar = screen.getByRole('textbox');
		userEvent.type(searchBar, input1);

		expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})
	})

	it('selects instance', async() => {
		let input1 = "Cell"
		let widgetName1 = "Parts of a Cell"

		let showDeletedCheckbox = screen.getByRole('checkbox');

		userEvent.click(showDeletedCheckbox);

		let searchBar = screen.getByRole('textbox');
		userEvent.type(searchBar, input1);

		expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getAllByText(widgetName1)).not.toBeNull();
		})

		// Clicks on instance
		userEvent.click(screen.getByText(widgetName1));

		// Shows edit page
		await waitFor(() => {
			expect(screen.getByText('Edit Widget')).toBeInTheDocument();
		})
	})
})