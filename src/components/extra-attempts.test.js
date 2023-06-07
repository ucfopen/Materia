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

import * as api from '../util/api'
import users from '../__test__/mockapi/users_get.json'
import ExtraAttemptsDialog from './extra-attempts-dialog'
import instances from '../__test__/mockapi/widget_instances_get.json'

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

describe('ExtraAttemptsDialog', () => {
	let rendered;
    let mockApiSearchUsers;
	let mockApiSetAttempts;
	let mockApiGetUsers;
	let mockApiGetExtraAttempts;

	// beforeEach(() => {
	// 	mockApiSearchUsers = jest.spyOn(api, 'apiSearchUsers').mockResolvedValue(users);
	// 	mockApiSetAttempts = jest.spyOn(api, 'apiSetAttempts').mockResolvedValue(true);
	// 	mockApiGetUsers = jest.spyOn(api, 'apiGetUsers').mockResolvedValue(users);
	// 	mockApiGetExtraAttempts = jest.spyOn(api, 'apiSetAttempts').mockResolvedValue();

	// 	act(() => {
	// 		rendered = renderWithClient(<ExtraAttemptsDialog inst={instances[0]}/>)
	// 	})
	// })

    // afterEach(() => {
	// 	cleanup();
	// 	jest.clearAllMocks();
    // })

    // it('gives student extra attempts', async () => {
	// 	// Shows copy dialog
	// 	let btn = screen.getByText('Extra Attempts');
	// 	act(() => {
	// 		userEvent.click(btn);
	// 	})

	// 	await waitFor(() => {
	// 		expect(screen.getByText('Give Students Extra Attempts')).toBeInTheDocument();
	// 	})

	// 	let search = screen.getByLabelText('Add students:');
	// 	await act(async() => {
	// 		userEvent.type(search, "test");
	// 	})

	// 	await waitFor(() => {
	// 		expect(mockApiSearchUsers).toHaveBeenCalled();
	// 		expect(screen.getByText('Unofficial Test User 05f2db072c')).toBeInTheDocument();
	// 		expect(screen.getByText('Unofficial Test User 34f5b1afec')).toBeInTheDocument();
	// 		expect(screen.getByText('Unofficial Test User 6f17ffa34b')).toBeInTheDocument();
	// 		expect(screen.getByText('Unofficial Test User f664f64d7d')).toBeInTheDocument();
	// 	})

	// 	act(() => {
	// 		userEvent.click(screen.getByText('Unofficial Test User 05f2db072c'));
	// 	})

	// 	await waitFor(() => {
	// 		expect(screen.getByText('Unofficial Test User 05f2db072c')).toBeInTheDocument();
	// 	})

	// 	// Try saving without adding course ID
	// 	let save_btn = screen.getByText('Save');
	// 	act(() => {
	// 		userEvent.click(save_btn);
	// 	})

	// 	expect(screen.getByText('Must fill in Course ID field')).toBeInTheDocument();

	// 	let course_id_text = screen.getByPlaceholderText("e.g. 'nGjdE'");
	// 	userEvent.type(course_id_text, 'fafsa');

	// 	await waitFor(() => {
	// 		expect(mockApiSetAttempts).toHaveBeenCalled();
	// 		expect(screen.getByText('Give Students Extra Attempts')).toBeNull();
	// 	})

	// })

	it('deletes widget', () => {

	})

	it('undeletes widget', () => {

	})
})
