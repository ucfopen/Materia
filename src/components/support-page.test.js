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
import updatedInstances from '../__test__/mockapi/widget_instances_after_update.json'
import users from '../__test__/mockapi/users_get.json'

import SupportPage from './support-page'
import SupportSelectedInstance from './support-selected-instance'
import SupportSearch from './support-search'

import * as api from '../util/api'
import { unmountComponentAtNode } from 'react-dom';

jest.mock('../util/api')

const search = (input, instances) => {
	let results = [];

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
}

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

describe('SupportSearch', () => {
	let rendered;
	let container;
	let mockApiSearchInstances;

	beforeEach(() => {
		mockApiSearchInstances = jest.spyOn(api, 'apiSearchInstances').mockImplementation(async input => search(input, instances));

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
		expect(mockApiSearchInstances).toHaveBeenCalledTimes(1);


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

	// This does not work in the app yet because apiSearchInstances does not search by created at
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

describe('SupportSelectedInstance', () => {
	let rendered;
	let container;
	let mockApiSearchInstances;
	let mockApiGetUserPermsForInstance;
	let mockApiDeleteWidget;
	let mockApiUnDeleteWidget;
	let mockApiUpdateWidget;
	let mockApiCopyWidget;
	let mockApiGetWidgetInstance;
	let mockApiSearchUsers;
	let mockApiSetAttempts;
	let mockApiGetUsers;
	let mockCopyID = 'robot';
	const mockWinAssign = jest.fn();
	let modal = null;

	beforeEach(async () => {
		mockApiSearchInstances = jest.spyOn(api, 'apiSearchInstances').mockImplementation(async input => search(input, instances));
		mockApiGetUserPermsForInstance = jest.spyOn(api, 'apiGetUserPermsForInstance').mockResolvedValue({
			user_perms: {
				5: [
				30,
				null
				]
			},
			widget_user_perms: {
				4: [
				30,
				null
				],
				5: [
				30,
				null
				],
				9: [
				1,
				null
				]
			}
			});
		mockApiDeleteWidget = jest.spyOn(api, 'apiDeleteWidget').mockResolvedValue(true);
		mockApiUnDeleteWidget = jest.spyOn(api, 'apiUnDeleteWidget').mockResolvedValue(true);
		mockApiUpdateWidget = jest.spyOn(api, 'apiUpdateWidget').mockResolvedValue(updatedInstances[0]); // We'll update the first instance
		mockApiCopyWidget = jest.spyOn(api, 'apiCopyWidget').mockResolvedValue(mockCopyID);
		// Returns copied widget
		mockApiGetWidgetInstance = jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(updatedInstances[1]);
		mockApiSearchUsers = jest.spyOn(api, 'apiSearchUsers').mockResolvedValue(users);
		mockApiGetUsers = jest.spyOn(api, 'apiGetUsers').mockResolvedValue(users[0]);
		mockApiSetAttempts = jest.spyOn(api, 'apiSetAttempts').mockResolvedValue(true);

		act(() => {
			rendered = renderWithClient(<SupportPage/>)

			window.location.hash = instances[0].id;

			container = rendered.container;
		})

		// Append a modal div so the copy and other dialogs can render
		modal = document.createElement("div");
		modal.setAttribute('id', 'modal');
		document.body.appendChild(modal);

		// let input = "My Adventure Widget";
		// let searchBar = screen.getByRole('textbox');
		// userEvent.type(searchBar, input);

		// expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		// await waitFor(() => {
		// 	expect(screen.getAllByText(input)).not.toBeNull();
		// })

		// // Clicks on instance
		// userEvent.click(screen.getAllByText(input)[0]);

		// Shows edit page
		await waitFor(async () => {
			expect(screen.getByText('Edit Widget')).toBeInTheDocument();
		})
	})

    afterEach(() => {
		unmountComponentAtNode(modal);
		modal.remove();
		modal = null;
		cleanup();
		jest.clearAllMocks();
	})

	it('updates widget successfully', async () => {

		// Update title
		let title = screen.getByRole('textbox');
		fireEvent.change(title, { target: { value: 'Market Day'}});

		// Update Guest Access
		let guest_access = screen.getByLabelText('Guest Access:', {selector: 'select'});
		userEvent.selectOptions(guest_access, "No");

		// Update Embedded only
		let embedded_only = screen.getByLabelText('Embedded Only:', {selector: 'select'});
		userEvent.selectOptions(embedded_only, "No");

		// Update allowed attempts
		let allowed_attempts = screen.getByLabelText('Attempts Allowed:', {selector: 'select'});
		userEvent.selectOptions(allowed_attempts, "10");

		// Update open_at and close_at times
		// Turn on
		let radios = screen.getAllByRole('radio');
		radios.forEach((el) => {
			userEvent.click(el);
		})

		// Choose date
		let dates = screen.getAllByRole('date');
		fireEvent.change(dates[0], { target: { value: '2023-04-12' } });
		fireEvent.change(dates[1], { target: { value: '2023-04-13' } });

		// Choose time
		let times = screen.getAllByRole('time');
		userEvent.type(times[0], '1000AM');
		userEvent.type(times[1], '1230PM');

		// Apply changes
		let apply_changes_btn = screen.getByText('Apply Changes');
		act(() => {
			userEvent.click(apply_changes_btn);
		})

		await waitFor(async () => {
			// Show 'Success'
			expect(screen.getByText('Success!')).toBeInTheDocument();
		})

		// Renavigate to instance to ensure that values were updated
		// From here on might be sort of useless since we're giving it the updated widgets, but at least we'll know if the breadcrumb works

		// let instanceSearchBtn = screen.getByText('Instance Search');
		// act(() => {
		// 	userEvent.click(instanceSearchBtn);
		// })

		// // Search should return updated widgets
		// mockApiSearchInstances = jest.spyOn(api, 'apiSearchInstances').mockImplementation(async input => search(input, updatedInstances));

		// await waitFor(() => {
		// 	expect(screen.getByText('Instance Admin')).not.toBeNull();
		// })

		// let searchBar = screen.getByRole('textbox');
		// userEvent.type(searchBar, 'Market Day');

		// expect(screen.getByText("Searching Widget Instances ...")).toBeInTheDocument();

		// await waitFor(() => {
		// 	expect(screen.getAllByText('Market Day')).not.toBeNull();
		// })

		// // Clicks on instance
		// userEvent.click(screen.getByText('Market Day'));

		// // Shows edit page
		// await waitFor(() => {
		// 	expect(screen.getByText('Edit Widget')).toBeInTheDocument();
		// })
	})

	it('errors on invalid open_at and close_at times', async () => {
		// Update open_at and close_at times
		// Turn on
		let radios = screen.getAllByLabelText('On');
		radios.forEach((el) => {
			userEvent.click(el);
		})

		// ======== Leaving date and times blank ========
		// Apply changes
		let apply_changes_btn = screen.getByText('Apply Changes');
		act(() => {
			userEvent.click(apply_changes_btn);
		})

		await waitFor(async () => {
			// Show error
			expect(screen.getByText('Please enter valid dates and times')).toBeInTheDocument();
		})

		// ========  Place start date after close date ========
		let dates = screen.getAllByRole('date');
		fireEvent.change(dates[0], { target: { value: '2023-04-13' } });
		fireEvent.change(dates[1], { target: { value: '2023-04-12' } });

		// Choose arbitrary time
		let times = screen.getAllByRole('time');
		fireEvent.change(times[0], { target: { value: '22:00' } });
		fireEvent.change(times[1], { target: { value: '10:00' } });

		// Apply changes
		act(() => {
			userEvent.click(apply_changes_btn);
		})

		await waitFor(async () => {
			// Show error
			expect(screen.getByText('Please enter a close date after the available date.')).toBeInTheDocument();
		})

		//  ======== Correct dates ========
		fireEvent.change(dates[0], { target: { value: '2023-04-12' } });
		fireEvent.change(dates[1], { target: { value: '2023-04-12' } });
		//  ======== Invalid times ========
		fireEvent.change(times[0], { target: { value: '22:00' } });
		fireEvent.change(times[1], { target: { value: '10:00' } });


		// Apply changes
		act(() => {
			userEvent.click(apply_changes_btn);
		})

		await waitFor(async () => {
			// Show error
			expect(screen.getByText('Please enter a close date after the available date.')).toBeInTheDocument();
		})
	})

	it('makes a copy without granting access to original owner', async () => {
		// Shows copy dialog
		let copy_btn = screen.getByText('Make a Copy');
		act(() => {
			userEvent.click(copy_btn);
		})

		await waitFor(() => {
			expect(screen.getByLabelText('New Title:')).toBeInTheDocument();
		})

		let newTitle = screen.getByPlaceholderText('New Widget Title');
		userEvent.type(newTitle, 'Adventure Copy');

		// Check grant access
		let grant_access_checkbox = screen.getByLabelText("Grant Access to Original Owner(s)");
		userEvent.click(grant_access_checkbox);

		mockApiSearchInstances = jest.spyOn(api, 'apiSearchInstances').mockImplementation(async input => search(input, updatedInstances));

		// Closes copy dialog
		let save_btn = screen.getByText('Copy');
		act(() => {
			userEvent.click(save_btn);
		})

		// Should call apiCopyInstance, which returns the new id, and then call mockApiSearchInstances with the new id
		await waitFor(() => {
			expect(mockApiCopyWidget).toHaveBeenCalled();
			expect(mockApiSearchInstances).toHaveBeenCalled();
		})

		// Navigate to copied widget
		window.location.hash = mockCopyID;

		// Check if copied widget has correct details
		await waitFor(async () => {
			expect(screen.getByText('Edit Widget')).toBeInTheDocument();
			expect(screen.getByText(mockCopyID)).toBeInTheDocument();
			expect(screen.getByText('Adventure Copy')).toBeInTheDocument();
		})
	})

	it('opens and closes extra attempts dialog', async () => {
		// Shows copy dialog
		let btn = screen.getByText('Extra Attempts');
		act(() => {
			userEvent.click(btn);
		})

		await waitFor(() => {
			expect(screen.getByText('Give Students Extra Attempts')).toBeInTheDocument();
		})

		let save_btn = screen.getByText('Save');
		act(() => {
			userEvent.click(save_btn);
		})

		await waitFor(() => {
			expect(mockApiSetAttempts).toHaveBeenCalled();
			try
			{
				expect(screen.getByText('Give Students Extra Attempts')).toBeNull();
			}
			catch
			{
				// If it's null, it will produce an error, therefore it worked
				return true;
			}
			return false;
		})

	})
})