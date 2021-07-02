import React from 'react';
import { render, screen, fireEvent, getByPlaceholderText, queryByTestId } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import MyWidgetsCollaborateDialog from './my-widgets-collaborate-dialog.jsx'
import { getInst } from '../util/test-helpers'
import '@testing-library/jest-dom'

// Mocks API calls for react query
jest.mock('../util/api', () => ({
	...jest.requireActual('../util/api').default,
	apiGetUsers: () => (new Promise((resolve, reject) => {
		resolve({
			999: {
				id: "999",
				is_student: false,
				avatar: "",
				first: "Test_Creator_First",
				last: "Test_Creator_Last"
			},
			3: {
				id: "3",
				is_student: false,
				avatar: "",
				first: "Test_Student_One",
				last: "Test_Lastname_One"
			},
			6: {
				id: "6",
				is_student: false,
				avatar: "",
				first: "Test_Student_Two",
				last: "Test_Lastname_Two"
			},
		})
	})),
	apiSearchUsers: () => (new Promise((resolve, reject) => {
		resolve([
			{
				id: "10",
				is_student: true,
				avatar: "",
				first: "Person_S",
				last: "Name"
			},
			{
				id: "11",
				is_student: false,
				avatar: "",
				first: "Not_S",
				last: "Person"
			},
		])
	}))
}))

const makeOtherUserPerms = () => {
	const keyValPermUsers = [
		[
			'3',
			{
				accessLevel: "1",
				expireTime: null,
				editable: false,
				shareable: false,
				can: {
					view: true,
					copy: false,
					edit: false,
					delete: false,
					share: false
				},
				remove: false
			}
		],
		[
			'6',
			{
				accessLevel: "1",
				expireTime: null,
				editable: false,
				shareable: false,
				can: {
					view: true,
					copy: false,
					edit: false,
					delete: false,
					share: false
				},
				remove: false
			}
		],
		[
			'999',
			{
				accessLevel: "30",
				expireTime: null,
				editable: true,
				shareable: true,
				can: {
					view: true,
					copy: true,
					edit: true,
					delete: true,
					share: true
				},
				remove: false
			}
		]
	]

	const othersPerms = new Map(keyValPermUsers)

	return othersPerms
}

const dateToStr = (date) => {
	if (!date) return ""
	return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()))
}

const dateToPickerStr = (date) => {
	if (!date) return ""
	return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()
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

const mockOnClose = jest.fn()

const mockSetOtherPerms = jest.fn()

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

	it('renders correctly', async () => {
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		expect(screen.getByText('Add people:')).not.toBeNull()
		expect(screen.getByText('Test_Creator_First Test_Creator_Last')).not.toBeNull()
		expect(screen.getByText('Test_Student_One Test_Lastname_One')).not.toBeNull()
		expect(screen.getByText('Test_Student_Two Test_Lastname_Two')).not.toBeNull()
		expect(screen.queryByText('Student')).toBeNull()
	})

	it('disables content when user does not have full access', async () => {
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: false }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '3' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Does not detect aria-hidden buttons of other collaborators
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(1)

		// Confirms that all elements are disabled
		const scoreDropDowns = screen.getAllByText(/View Scores/i)
		for (const dropDown of scoreDropDowns) {
			expect(dropDown).toBeDisabled()
		}

		const expireBtns = screen.getAllByRole('button', {
			name: /never/i
		})
		for (const btn of expireBtns) {
			expect(btn).toBeDisabled()
		}

		// Confirms the search bar isn't present
		expect(screen.queryByText('Add people:')).toBeNull()
	})

	test('search works properly', async () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Searches for the student Person_S
		const searchInput = screen.getByPlaceholderText(`Enter a Materia user's name or e-mail`)
		fireEvent.change(searchInput, { target: { value: 'Person_S' } })

		// Confirms the student is present in the search
		const student = await screen.findAllByText(/Person_S/i)
		expect(student.length).not.toBe(0)
	})

	it('displays modal when trying to add student without guest and prevents adding student', async () => {
		let testInst = getInst()
		testInst.guest_access = false
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Searches for the student Person_S
		const searchInput = screen.getByPlaceholderText(`Enter a Materia user's name or e-mail`)
		fireEvent.change(searchInput, { target: { value: 'Person_S' } })

		// Clicks on the student
		const student = await screen.findAllByText(/Person_S/i)
		fireEvent.click(student[0])

		// Confirms the modal popup and clicks the Okay button to dismiss it
		const modal = await screen.findAllByText(/Share Not Allowed/i)
		fireEvent.click(screen.getByRole('button', { name: /Okay/i }))

		// Confirms the modal closes and the student wasn't added
		expect(screen.queryByText(/Share Not Allowed/i)).toBeNull()
		expect(screen.queryByText(/Person_S/i)).toBeNull()
	})

	it('allows user to add non student', async () => {
		let testInst = getInst()
		testInst.guest_access = false
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Searches for the student Person_S
		const searchInput = screen.getByPlaceholderText(`Enter a Materia user's name or e-mail`)
		fireEvent.change(searchInput, { target: { value: 'S' } })

		// Clicks on the student
		const staffUser = await screen.findAllByText(/Not_S/i)
		fireEvent.click(staffUser[0])

		// Confirms the staff member was added, and since person_s is gone, the search list is also closed
		expect(screen.queryByText(/Not_S/i)).not.toBeNull()
		expect(screen.queryByText(/Person_S/i)).toBeNull()
	})

	it('allows user to add student when guest access is enabled', async () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Searches for the student Person_S
		const searchInput = screen.getByPlaceholderText(`Enter a Materia user's name or e-mail`)
		fireEvent.change(searchInput, { target: { value: 'S' } })

		// Clicks on the student
		const staffUser = await screen.findAllByText(/Person_S/i)
		fireEvent.click(staffUser[0])

		// Confirms the student was added, and since not_s is gone, the search list is also closed
		expect(screen.queryByText(/Not_S/i)).toBeNull()
		expect(screen.queryByText(/Person_S/i)).not.toBeNull()
	})

	it('allows changing Permissions', async () => {
		const testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Confirms only the current user has full access
		let comboBoxes = screen.getAllByRole('combobox')
		for (const val of comboBoxes) {
			if (val.dataset.testid === '999-select') expect(val.value).toBe('30')
			else expect(val.value).toBe('1')
		}

		// Changes combo box value to full access
		fireEvent.change(screen.getByTestId('6-select'), { target: { value: '30' } })

		// Confirms the user was given full access
		for (const val of comboBoxes) {
			if (val.dataset.testid === '999-select' || val.dataset.testid === '6-select') expect(val.value).toBe('30')
			else expect(val.value).toBe('1')
		}
	})

	it('allows changing Expiration date', async () => {
		let testInst = getInst()
		const curData = new Date()
		const newDate = new Date(curData.getTime() + 86400000)
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Confirms current user's expire is disabled and other user's is not
		expect(screen.getByTestId('999-never-expire')).toBeDisabled()
		expect(screen.getByTestId('6-never-expire')).not.toBeDisabled()

		// Clicks on other user's expire button
		fireEvent.click(screen.getByTestId('6-never-expire'))

		// Confirms the date picker is open
		expect(screen.getByPlaceholderText(/Date/i).value).toBe(dateToPickerStr(curData))

		// Changes the date to a new date
		fireEvent.change(screen.getByPlaceholderText(/Date/i), { target: { value: dateToPickerStr(newDate) } })

		// Confirms the date was updated
		expect(screen.getByPlaceholderText(/Date/i).value).toBe(dateToPickerStr(newDate))

		// Clicks on the Done button to confirm the new date
		fireEvent.click(screen.getByText(/Done/i))

		// Waits for the date text to update
		await screen.findAllByText(dateToStr(newDate))

		// Confirms the date was updated properly
		expect(screen.getByTestId('6-expire').innerHTML).toBe(dateToStr(newDate))
	})

	it('allows cancelling changing Expiration date', async () => {
		let testInst = getInst()
		const curData = new Date()
		const newDate = new Date(curData.getTime() + 86400000)
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		// Waits for data to load
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Confirms current user's expire is disabled and other user's is not
		expect(screen.getByTestId('999-never-expire')).toBeDisabled()
		expect(screen.getByTestId('6-never-expire')).not.toBeDisabled()

		// Clicks on other user's expire button
		fireEvent.click(screen.getByTestId('6-never-expire'))

		// Confirms the date picker is open
		expect(screen.getByPlaceholderText(/Date/i).value).toBe(dateToPickerStr(curData))

		// Changes the date to a new date
		fireEvent.change(screen.getByPlaceholderText(/Date/i), { target: { value: dateToPickerStr(newDate) } })

		// Confirms the date was updated
		expect(screen.getByPlaceholderText(/Date/i).value).toBe(dateToPickerStr(newDate))

		// Clicks on the Cancel button
		fireEvent.click(screen.getByText(/Set to Never/i))

		// Confirms the date wasn't changed
		expect(screen.getByTestId('6-never-expire')).not.toBeNull()
	})

	it('allows deletion of collaboration users', async () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Does not detect aria-hidden buttons of other collaborators
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(3)

		fireEvent.click(screen.getByTestId('6-delete-user'))

		// Does not detect aria-hidden buttons of other collaborators
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(2)
	})

	it('allows deletion of owner', async () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Confirms three buttons exist
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(3)

		// Tries to delete current user
		fireEvent.click(screen.getByTestId('999-delete-user'))

		// Checks confirmation modal appears
		expect(screen.queryByTestId('accept-remove-access')).not.toBeNull()

		// Clicks on accept button
		fireEvent.click(screen.getByTestId('accept-remove-access'))

		// Checks confirmation modal appears
		expect(screen.queryByTestId('accept-remove-access')).toBeNull()

		// Confirms owner leaves
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(2)
	})

	it('allows canceling deletion of owner', async () => {
		let testInst = getInst()
		const rendered = renderWithClient(<MyWidgetsCollaborateDialog onClose={mockOnClose} inst={testInst} myPerms={{ shareable: true }} otherUserPerms={makeOtherUserPerms()} currentUser={{ id: '999' }} setOtherUserPerms={mockSetOtherPerms} />)
		await screen.findAllByText('Test_Student_One Test_Lastname_One')

		// Confirms three buttons exist
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(3)

		// Tries to delete current user
		fireEvent.click(screen.getByTestId('999-delete-user'))

		// Checks confirmation modal appears
		expect(screen.queryByTestId('cancel-remove-access')).not.toBeNull()

		// Clicks on cancel button
		fireEvent.click(screen.getByTestId('cancel-remove-access'))

		// Checks confirmation modal appears
		expect(screen.queryByTestId('cancel-remove-access')).toBeNull()

		// Confirms owner stays
		expect(screen.getAllByRole('button', {
			name: /x/i
		}).length).toBe(3)
	})

})