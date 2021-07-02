import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider, QueryCache, useQuery } from 'react-query'
import MyWidgetsSettingsDialog from './my-widgets-settings-dialog.jsx';
import rawPermsToObj from '../util/raw-perms-to-object'
import '@testing-library/jest-dom'

const getInst = () => ({
	id: '12345',
	user_id: 1,
	widget_id: 1,
	published_by: 1,
	name: 'Test Widget',
	created_at: 1611851557,
	updated_at: 1617943440,
	open_at: 1611851888,
	close_at: 1611858888,
	height: 0,
	width: 0,
	attempts: -1,
	is_draft: false,
	is_deleted: false,
	guest_access: true,
	is_student_made: false,
	embedded_only: false
})

const makeOtherUserPerms = () => {
	const othersPerms = new Map()
	const permUsers = {
		3: [
			"1",
			null
		],
		6: [
			"30",
			null
		]
	}
	for (const i in permUsers) {
		othersPerms.set(i, rawPermsToObj(permUsers[i], true))
	}

	return othersPerms
}

// Mocks the API call
jest.mock('react-query', () => ({
	...jest.requireActual('react-query'),
	useQuery: jest.fn(() => ({
		data: {
			1: {
				is_student: false
			}
		}
	}))
}))

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

const mockOnClose = jest.fn()

// MOCK API CALL figure out otherUsers
describe('MyWidgetsSettingsDialog', () => {

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

	it('Renders correctly depending on guest mode', () => {
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		// Guest Mode enabled
		expect(screen.getByLabelText(/Normal/i).checked).toBe(false)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(true)
		expect(screen.getByText('20').closest('div').classList.contains('disabled')).toBe(true)
		expect(screen.getByLabelText('attempts-input')).toBeDisabled()
		expect(screen.queryByText('Attempts are unlimited when Guest Mode is enabled.')).not.toBeNull()

		// disables Guest Mode
		fireEvent.click(screen.getByLabelText(/Normal/i))

		// Guest Mode disabled
		expect(screen.getByLabelText(/Normal/i).checked).toBe(true)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(false)
		expect(screen.getByText('20').closest('div').classList.contains('disabled')).toBe(false)
		expect(screen.getByLabelText('attempts-input')).not.toBeDisabled()
		expect(screen.queryByText('Attempts are unlimited when Guest Mode is enabled.')).toBeNull()
	})

	it('Should select On input when time is selected and AM input when time is blurred', () => {
		let testInst = getInst()
		testInst.open_at = -1
		testInst.close_at = -1
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		// Anytime checkbox should start checked and am/pm input should both be off
		expect(screen.getByLabelText('anytime-input-0').checked).toBe(true)
		expect(screen.getByLabelText('on-input-0').checked).toBe(false)
		expect(screen.getByLabelText('am-input-0').classList.contains('selected')).toBe(false)
		expect(screen.getByLabelText('pm-input-0').classList.contains('selected')).toBe(false)

		// Click on time input
		fireEvent.click(screen.getByLabelText('time-input-0'))

		// On checkbox should be checked and not anytime
		expect(screen.getByLabelText('anytime-input-0').checked).toBe(false)
		expect(screen.getByLabelText('on-input-0').checked).toBe(true)

		// Blurs the time input
		fireEvent.blur(screen.getByLabelText('time-input-0'))

		// Am should only be selected
		expect(screen.getByLabelText('am-input-0').classList.contains('selected')).toBe(true)
		expect(screen.getByLabelText('pm-input-0').classList.contains('selected')).toBe(false)
	})

	it('Displays a warning when changing from guest mode with a student collaborator', () => {
		// Changes the returned value of useQuery for this test only
		useQuery.mockImplementation(() => ({
			data: {
				1: {
					is_student: true
				}
			}
		}))
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		// Modal should start closed and guest mode should be checked
		expect(screen.getByLabelText(/Normal/i).checked).toBe(false)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(true)
		expect(screen.queryByText('Students with access will be removed')).toBeNull()

		// Opens warning modal
		fireEvent.click(screen.getByLabelText(/Normal/i))

		// Checkboxes should remain the same
		expect(screen.getByLabelText(/Normal/i).checked).toBe(false)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(true)
		expect(screen.queryByText('Students with access will be removed')).not.toBeNull()

		// Accepts warning modal
		fireEvent.click(screen.getByLabelText('remove-student'))

		// Normal checkbox should be checked and the modal should be closed
		expect(screen.getByLabelText(/Normal/i).checked).toBe(true)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(false)
		expect(screen.queryByText('Students with access will be removed')).toBeNull()
	})

	test('Rejecting the warning when changing from guest mode with a student collaborator', () => {
		// Changes the returned value of useQuery for this test only
		useQuery.mockImplementation(() => ({
			data: {
				1: {
					is_student: true
				}
			}
		}))
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		// Modal should start close and guest mode should be active
		expect(screen.getByLabelText(/Normal/i).checked).toBe(false)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(true)
		expect(screen.queryByText('Students with access will be removed')).toBeNull()

		// Opens warning modal
		fireEvent.click(screen.getByLabelText(/Normal/i))

		// Modal should popup
		expect(screen.queryByText('Students with access will be removed')).not.toBeNull()

		// Rejects warning modal
		fireEvent.click(screen.getByLabelText('close-warning-modal'))

		// Checkboxes should remain the same and modal should be closed
		expect(screen.getByLabelText(/Normal/i).checked).toBe(false)
		expect(screen.getByLabelText(/Guest Mode/i).checked).toBe(true)
		expect(screen.queryByText('Students with access will be removed')).toBeNull()
	})

	test('Setting the slider input should change the highlighted value', () => {
		let testInst = getInst()
		testInst.guest_access = false
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		const attemptBtns = screen.getByLabelText('attempts-choices-container').children
		const attemptsValue = '59'

		// Unlimited should be the only active span
		for (const attemptButton of attemptBtns) {
			const btnText = attemptButton.textContent
			if (btnText !== 'Unlimited') {
				expect(attemptButton.classList.contains('active')).toBe(false)
			}
			else {
				expect(attemptButton.classList.contains('active')).toBe(true)
			}
		}

		// Selected 15 attempts
		fireEvent.change(screen.getByLabelText("attempts-input"), {
			target: {
				value: attemptsValue,
			},
		})

		// Lifts mouse from input
		fireEvent.mouseUp(screen.getByLabelText("attempts-input"))

		// Value should be 
		expect(screen.getByLabelText("attempts-input").value).toBe(attemptsValue)

		// 15 should be the only active span
		for (const attemptButton of attemptBtns) {
			const btnText = attemptButton.textContent
			if (btnText !== '15') {
				expect(attemptButton.classList.contains('active')).toBe(false)
			}
			else {
				expect(attemptButton.classList.contains('active')).toBe(true)
			}
		}
	})

	test('Setting the slider input in guest mode should not change the slider', () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)

		const attemptBtns = screen.getByLabelText('attempts-choices-container').children
		const attemptsValue = '59'

		// Unlimited should be the only active span
		for (const attemptButton of attemptBtns) {
			const btnText = attemptButton.textContent
			if (btnText !== 'Unlimited') {
				expect(attemptButton.classList.contains('active')).toBe(false)
			}
			else {
				expect(attemptButton.classList.contains('active')).toBe(true)
			}
		}

		// Selected 15 attempts
		fireEvent.change(screen.getByLabelText("attempts-input"), {
			target: {
				value: attemptsValue,
			},
		})

		// Lifts mouse from input
		fireEvent.mouseUp(screen.getByLabelText("attempts-input"))

		// Value shouldn't change
		expect(screen.getByLabelText("attempts-input").value).toBe('100') // 100 is the slider value of Unlimited

		// Unlimited should still be the only active span
		for (const attemptButton of attemptBtns) {
			const btnText = attemptButton.textContent
			if (btnText !== 'Unlimited') {
				expect(attemptButton.classList.contains('active')).toBe(false)
			}
			else {
				expect(attemptButton.classList.contains('active')).toBe(true)
			}
		}
	})

	it('should switch between am/pm when the respective span is clicked', () => {
		let testInst = getInst()
		testInst.open_at = -1
		testInst.close_at = -1
		const rendered = renderWithClient(<MyWidgetsSettingsDialog onClose={mockOnClose} inst={testInst} currentUser={{ is_student: false }} otherUserPerms={makeOtherUserPerms()} />)
		const amBtn = screen.getByLabelText('am-input-0')
		const pmBtn = screen.getByLabelText('pm-input-0')

		expect(amBtn.classList.contains('selected')).toBe(false)
		expect(pmBtn.classList.contains('selected')).toBe(false)

		fireEvent.click(amBtn)

		expect(amBtn.classList.contains('selected')).toBe(true)
		expect(pmBtn.classList.contains('selected')).toBe(false)

		fireEvent.click(pmBtn)

		expect(amBtn.classList.contains('selected')).toBe(false)
		expect(pmBtn.classList.contains('selected')).toBe(true)
	})
})
