/**
 * @jest-environment jsdom
 */

// Support page redirects to admin/user and admin/instances so this encompasses those basically

import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import widgets from '../__test__/mockapi/admin_widgets_get.json'

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

describe('AdminInstances', () => {
    it('renders page')

    it('returns search results if there are matches')

    it('returns no search results if there are no matches')

    it('shows widget instance editor')

    it('shows success message after applying changes successfully')

    it('shows error message after apply change fails')

    it('redirects to copied widget after copying widget successfully')

    it('redirects to creator page after clicking Edit Widget')

    it('adds a collaborator and updates number of collaborators')

    it('adds extra attempts')

	it('deletes widget instance')
	// should gray out adding collaborator or extra attempts

    it('shows deleted instance in search')

	it('undeletes widget instance')
	// should un-gray out adding collaborator or extra attempts

    it('should not load page if user is not logged in')
})