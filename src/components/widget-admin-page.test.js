import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import widgets from '../__test__/mockapi/admin_widgets_get.json'

import WidgetAdminPage from './widget-admin-page'
import WidgetInstall from './widget-admin-install'
import WidgetList from './widget-admin-list'
import WidgetListCard from './widget-admin-list-card'

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

describe('WidgetAdmin', () => {

    it('should render widget admin page', async () => {
        renderWithClient(<WidgetAdminPage />)

        expect(screen.queryByText(/Install Widget/i)).not.toBeNull()
        expect(screen.queryByText(/Widget List/i)).not.toBeNull()

        // Should render Header
        expect(screen.queryByText(/Widget Catalog/i)).not.toBeNull()
        expect(screen.queryByText(/My Widgets/i)).not.toBeNull()
        expect(screen.queryByText(/Help/i)).not.toBeNull()

        cleanup()
    })
})

describe('WidgetInstall', () => {

    const uploadFile = async (fileName) => {
        const file = new File([new ArrayBuffer(1)], fileName)

        const uploader = await screen.findByLabelText(/Upload .wigt/i, {selector: 'input'})

        await waitFor(() => {
            fireEvent.change(uploader, {target: {files: [file]}})
        })

        fireEvent.click(uploader)
    }

    it('should render widget installer', () => {

        const mockFetchWidgets = jest.fn()

        renderWithClient(<WidgetInstall refetchWidgets={mockFetchWidgets}/>)

        expect(screen.queryByText(/Install Widget/i)).not.toBeNull()
        expect(screen.queryByText(/widget package file to install a new widget or upgrade an existing widget on Materia./i)).not.toBeNull()

        cleanup()
    })

    it('should render success message after uploading .wigt file', async () => {
        const mockUpload = jest.spyOn(api, 'apiUploadWidgets').mockResolvedValue({
            ok: true,
            status: 200
        })

        const mockRefetch = jest.spyOn(api, 'apiGetWidgetsAdmin').mockResolvedValue(widgets)
        
        renderWithClient(<WidgetInstall refetchWidgets={mockRefetch}/>)

        await uploadFile('Adventure.wigt')

        expect(await screen.findByText(/Successfully uploaded 'Adventure.wigt'!/i)).not.toBeNull()

        cleanup()
        mockUpload.mockRestore()
        mockRefetch.mockRestore()
    })

    it('should render error message if uploading non .wigt file', async () => {
        const mockRefetch = jest.spyOn(api, 'apiGetWidgetsAdmin').mockResolvedValue(widgets)
        
        renderWithClient(<WidgetInstall refetchWidgets={mockRefetch}/>)

        await uploadFile('Adventure.png')

        expect(await screen.findByText(/File type not accepted! Please upload a .wigt file./i)).not.toBeNull()

        cleanup()
        mockRefetch.mockRestore()
    })

    it('should render error message if upload failed', async () => {
        const mockUpload = jest.spyOn(api, 'apiUploadWidgets').mockResolvedValue({
            ok: false,
            status: 400
        })

        const mockRefetch = jest.spyOn(api, 'apiGetWidgetsAdmin').mockResolvedValue(widgets)
        
        renderWithClient(<WidgetInstall refetchWidgets={mockRefetch}/>)

        await uploadFile('Adventure.wigt')

        expect(await screen.findByText(/Failed to upload 'Adventure.wigt'/i)).not.toBeNull()

        cleanup()
        mockUpload.mockRestore()
        mockRefetch.mockRestore()
    })
})

describe('WidgetList', () => {

    afterEach(() => {
        cleanup()
    })

    it('should load all widgets', async () => {
        renderWithClient(<WidgetList widgets={widgets} isLoading={false}/>)

        let count = 0;
        for (const w of widgets) {
            const widget = await screen.findByText(w.name);
            expect(widget).not.toBeNull()
            count++;
        }
        expect(count).toBe(widgets.length)
        
    })

    it('should not load all widgets', async () => {
        renderWithClient(<WidgetList widgets={widgets} isLoading={true}/>)

        for (const w of widgets) {
            const widget = screen.queryByText(w.name);
            expect(widget).not.toBeInTheDocument();
        }
    })
    
})

describe('WidgetListCard', () => {
    let widget = widgets[0];

    beforeEach(() => {
        renderWithClient(<WidgetListCard widget={widget} isLoading={false}/>)
    })

    afterEach(() => {
        cleanup()
    })

    it('should render widget details after clicking on title', async () => {
        // Open widget card
        fireEvent.click(await screen.findByText(widget.name));

        expect(await screen.findByText(widget.id)).not.toBeNull()
        expect(await screen.findByText(widget.created_at)).not.toBeNull()
        expect(await screen.findByText(widget.meta_data.excerpt)).not.toBeNull()
        expect(await screen.findByText(widget.meta_data.about)).not.toBeNull()
    })

    it('should render success message when update is successful', async () => {
        const mockUpdate = jest.spyOn(api, 'apiUpdateWidgetAdmin').mockResolvedValue([true, true, true])
       
        // Open widget card
        fireEvent.click(await screen.findByText(widget.name));

        // Make changes to widget
        fireEvent.click(await screen.findByLabelText(/In Catalog/i, {selector: 'input'}))
        fireEvent.click(await screen.findByLabelText(/Is Editable/i, {selector: 'input'}))
        fireEvent.click(await screen.findByLabelText(/Is Scorable/i, {selector: 'input'}))
        fireEvent.change(await screen.findByLabelText(/About/i, {selector: 'textarea'}), {target: {value: 'What is this widget about?'}})
        fireEvent.change(await screen.findByLabelText(/Excerpt/i, {selector: 'textarea'}), {target: {value: 'Some content here'}})

        // Save changes
        fireEvent.click(await screen.findByText('Save Changes'))

        expect(await screen.findByText(/Widget Saved!/i)).not.toBeNull()

        expect(mockUpdate).toHaveBeenCalledTimes(1);

        mockUpdate.mockRestore()

    })

    it('should render error message when demo instance not found', async () => {
        const mockUpdate = jest.spyOn(api, 'apiUpdateWidgetAdmin').mockResolvedValue(['Demo instance not found!', true, true])

        // Open widget card
        fireEvent.click(await screen.findByText(widget.name));

        // Change demo instance
        fireEvent.change(await screen.findByLabelText(/Demo/i, {selector: 'input'}), {target: {value: ''}})

        // Save changes
        fireEvent.click(await screen.findByText('Save Changes'))

        expect(await screen.findByText(/Demo instance not found!/i)).not.toBeNull()

        expect(mockUpdate).toHaveBeenCalledTimes(1);

        mockUpdate.mockRestore()
    })
})

