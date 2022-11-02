import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act } from 'react-dom/test-utils';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import WidgetCreator from './widget-creator'
import WidgetCreatorPage from './widget-creator-page'

import * as api from '../util/api'

import widgetInstance from '../__test__/mockapi/crossword_demo_instance.json'
import widgetInfo from '../__test__/mockapi/crossword_demo_widget_info.json'
import qset from '../__test__/mockapi/crossword_demo_qset.json'
        
jest.mock('../util/api')

// Enables testing with react query
const renderWithClient = async (children) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Turns retries off
				retry: false,
			},
		},
	})
	let rendered;

	await waitFor(() => {
		rendered = render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)
	})

	const {rerender, ...result} = rendered;

	return {
        ...result,
		rerender: (rerenderUi) =>
			rerender(<QueryClientProvider client={queryClient}>{rerenderUi}</QueryClientProvider>)
	}
}

describe('Widget Creator', () => {
    let mockApiGetWidgetInstance,
    mockApiGetWidget,
    mockApiGetQuestionQset,
    mockApiGetWidgetLock,
    mockApiAuthorVerify,
    mockApiCanBePublishedByCurrentUser,
    mockApiSaveWidget;

    // Setup the default mock implementations
    beforeAll(() => {
        mockApiGetWidgetInstance = jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(widgetInstance)
        mockApiGetWidget = jest.spyOn(api, 'apiGetWidget').mockResolvedValue(widgetInfo)
		mockApiGetQuestionQset = jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(qset)
        mockApiGetWidgetLock = jest.spyOn(api, 'apiGetWidgetLock').mockResolvedValue(true)
        mockApiAuthorVerify = jest.spyOn(api, 'apiAuthorVerify').mockResolvedValue(true)
        mockApiCanBePublishedByCurrentUser = jest.spyOn(api, 'apiCanBePublishedByCurrentUser').mockResolvedValue(true)
        mockApiSaveWidget = jest.spyOn(api, 'apiSaveWidget').mockImplementation(w => widgetInstance)
    })

    // Restore default values before each test
    // Setup window location pathname and hash value
    beforeEach(() => {
        mockApiGetWidgetInstance.mockResolvedValue(widgetInstance)
        mockApiGetWidget.mockResolvedValue(widgetInfo)
		mockApiGetQuestionQset.mockResolvedValue(qset)
        mockApiGetWidgetLock.mockResolvedValue(true)
        mockApiAuthorVerify.mockResolvedValue(true)
        mockApiCanBePublishedByCurrentUser.mockResolvedValue(true)
        mockApiSaveWidget.mockResolvedValue(widgetInstance)

        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/widgets/1-crossword/create',
                hash: `#${widgetInstance.id}`
            },
            writable: true
        });
    })

    // Because jest shares mocks between all test files
    // We need to clear mock.calls, mock.results, and mock.instances
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render existing widget instance', async () => {
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        // Firstly, is window.location correct?
        expect(window.location.pathname).toEqual('/widgets/1-crossword/create'); 
        expect(window.location.hash).toEqual(`#${widgetInstance.id}`); 

        // Next, does the iframe have the correct src attribute?
        expect(await rendered.queryByTitle('Widget Embed')).toHaveAttribute('src', expect.stringContaining(`${window.WIDGET_URL + widgetInstance.widget.dir + widgetInstance.widget.creator}?${widgetInstance.widget.created_at}`));

        // Check to see if action bar is loaded
        expect(await rendered.queryByText('Save Draft')).toBeTruthy()
        expect(await rendered.queryByText('Save History')).toBeTruthy()
        // Button should be set to 'Update' if instance is published
        expect(await rendered.queryByText('Update')).toBeTruthy()
    })

    it('should render new widget instance', async () => {
        let rendered;

        mockApiGetWidgetInstance.mockResolvedValue(undefined)
		mockApiGetQuestionQset.mockResolvedValue(undefined)

        window.location.hash = ''

		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        // Action bar
        expect(await rendered.queryByText('Save Draft')).toBeTruthy()
        expect(await rendered.queryByText('Save History')).toBeFalsy()
    })

    it('selects a qset from save history', async () => {
        let rendered;

        await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Open the Save History
        const saveHistoryButton = await rendered.queryByText('Save History')
        fireEvent.click(saveHistoryButton)

        // Show embed dialog
        expect(await rendered.queryByTitle('Embed Dialog')).toHaveAttribute('src', expect.stringContaining(`${window.BASE_URL}qsets/import/?inst_id=${widgetInstance.id}`))

        // Select a qset from save history
        act(() => {
            window.Materia.Creator.onQsetHistorySelectionComplete(JSON.stringify(qset));
        })

        // Hide action bar
        expect(await rendered.queryByText('Save History')).toBeFalsy()

        // Hide embed dialog
        expect(await rendered.queryByTitle('Embed Dialog')).not.toHaveAttribute('src', expect.stringContaining(`${window.BASE_URL}qsets/import/?inst_id=${widgetInstance.id}`))

        expect(await rendered.queryByText('Previewing Prior Save')).toBeTruthy()

        // Press 'Keep' button to keep the selected qset
        const keepButton = await rendered.queryByTestId('keep_qset');

        fireEvent.click(keepButton);

        expect(await rendered.queryByText('Previewing Prior Save')).toBeFalsy()
        // Shows action bar
        expect(await rendered.queryByText('Save History')).toBeTruthy()

    })

    it('embeds the question importer', async () => {
        let rendered;

        await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Import Questions
        const importQuestionsBtn = await rendered.queryByText('Import Questions...')
        fireEvent.click(importQuestionsBtn)

        // Embed the question importer
        expect(await rendered.queryByTitle('Embed Dialog')).toHaveAttribute('src', expect.stringContaining(`${window.BASE_URL}questions/import/?type=${encodeURIComponent(widgetInfo.meta_data.supported_data.join())}`))

        // Import a question
        act(() => {
            window.Materia.Creator.onQuestionImportComplete(JSON.stringify(qset.data.items[0].items));
        })

        // Hide the question importer
        expect(await rendered.queryByTitle('Embed Dialog')).not.toHaveAttribute('src', expect.stringContaining(`${window.BASE_URL}questions/import/?type=${encodeURIComponent(widgetInfo.meta_data.supported_data.join())}`))

    })
    
    it('displays popup on publish pressed', async () => {
        // Convert widget instance to draft
        const draftWidgetInstance = {
            ...widgetInstance,
            is_draft: true
        }
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)
        
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        // Click Publish
        const publishButton = await rendered.queryByText('Publish...')
        fireEvent.click(publishButton)

        // Get warning
        expect(await rendered.queryByText('Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores & data.')).toBeTruthy()

        // Cancel publish
        const cancelPublishButton = await rendered.queryByText('Cancel')
        fireEvent.click(cancelPublishButton)

        // Remove warning
        expect(await rendered.queryByText('Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores & data.')).toBeFalsy()
    })

    it('should publish widget', async () => {
        // Convert widget instance to draft
        const draftWidgetInstance = {
            ...widgetInstance,
            is_draft: true
        }
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)
        
        let rendered;
		await act(async () => {
            rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Publish
        const publishButton = await rendered.queryByText('Publish...')
        fireEvent.click(publishButton)

        // Get warning
        expect(await rendered.queryByText('Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores & data.')).toBeTruthy()

        // Continue publish
        const yesPublish = await rendered.queryByText('Yes, Publish')
        fireEvent.click(yesPublish)

        expect(await rendered.queryByText('Saving...')).toBeTruthy()

        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'save',
                data: [widgetInstance.name, qset, 1]
            }
        }

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        expect(await rendered.queryByText('Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores & data.')).toBeFalsy()

        // Widget is saved
        expect(mockApiSaveWidget).toHaveBeenCalled()
        // Page redirects to my-widgets page
        expect(window.location).toEqual(`${window.MY_WIDGETS_URL}#${widgetInstance.id}`);

    })

    it('displays publish restricted', async () => {
        // Convert widget instance to draft
        const draftWidgetInstance = {
            ...widgetInstance,
            is_draft: true
        }
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)

        mockApiCanBePublishedByCurrentUser.mockResolvedValue(false)
        
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        // Click Publish
        const publishButton = await rendered.queryByText('Publish...')
        fireEvent.click(publishButton)

        // Get warning
        expect(await rendered.queryByText('Students are not allowed to publish this widget.')).toBeTruthy()

        // Cancel publish
        const cancelPublishButton = await rendered.queryByText('Cancel')
        fireEvent.click(cancelPublishButton)

        // Remove warning
        expect(await rendered.queryByText('Students are not allowed to publish this widget.')).toBeFalsy()
    })

    it('displays popup on update pressed', async () => {
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Update
        const updateButton = await rendered.queryByText('Update')
        fireEvent.click(updateButton)

        // Show warning
        expect(await rendered.queryByText('Updating this published widget will instantly allow your students to see your changes.')).toBeTruthy()

        // Cancel publish
        const cancelPublishButton = await rendered.queryByText('Cancel')
        fireEvent.click(cancelPublishButton)

        // Hide dialog
        expect(await rendered.queryByText('Updating this published widget will instantly allow your students to see your changes.')).toBeFalsy()
    })
    
    it('should display alert dialog if widget is locked', async () => {
        let rendered;

        mockApiGetWidgetLock.mockResolvedValue(false)

		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Render alert dialog
        expect(await rendered.queryByText('Someone else is editing this widget, you will be able to edit after they finish.')).toBeTruthy()
    })
    
    it('should error if user does not have correct permissions to access qset', async () => {
        let rendered;

        mockApiGetQuestionQset.mockResolvedValue({title: 'Permission Denied'})

		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Render alert dialog
        expect(await rendered.queryByText('Permission Denied')).toBeTruthy()
        // Render No Permission page
        expect(await rendered.queryByText("You don't have permission to view this page.")).toBeTruthy()
        // Render Support Info
        expect(await rendered.queryByText("Trouble Logging In?")).toBeTruthy()
    })
    
    it('should display alert dialog if qset cannot be loaded', async () => {
        mockApiGetQuestionQset.mockResolvedValue(undefined)
        
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        expect(await rendered.queryByText('Unable to load widget data.')).toBeTruthy()
    })
    
    it('should display alert dialog if widget is not a draft and widget cannot be published', async () => {
        mockApiCanBePublishedByCurrentUser.mockResolvedValue(false)
        
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        expect(await rendered.queryByText('Widget type can not be edited by students after publishing.')).toBeTruthy()
    })

    it('should display alert dialog if user is not logged in', async () => {
        mockApiAuthorVerify.mockResolvedValue(false)
        
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })
        
        expect(await rendered.queryByText('You have been logged out due to inactivity')).toBeTruthy()
    })

    it('should show media importer and import media', async () => {
        const types = ['jpg', 'gif', 'png', 'mp3']
        
        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'showMediaImporter',
                data: types
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Show media importer
        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        expect(await rendered.queryByTitle('Embed Dialog')).toHaveAttribute('src', expect.stringContaining(`${window.BASE_URL}media/import#${types.join(',')}`))

        // Import media
        const file = new File([""], "filename", {});
        act(() => {
            window.Materia.Creator.onMediaImportComplete(file);
        })

        // Hide embed dialog
        expect(await rendered.queryByTitle('Embed Dialog')).toHaveAttribute('src', expect.stringContaining(''))

    })

    it('should save draft of new widget', async () => {
        // Create new widget
        window.location.hash = ''

        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'save',
                data: [widgetInstance.name, qset, 1]
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        expect(mockApiGetWidgetInstance).not.toHaveBeenCalled()
        expect(mockApiGetQuestionQset).not.toHaveBeenCalled()
        expect(mockApiGetWidget).toHaveBeenCalled()

        const saveDraftButton = await rendered.queryByText('Save Draft')
        fireEvent.click(saveDraftButton);

        // Save widget
        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Setting the instance id causes these api requests to be called
        expect(mockApiGetWidgetInstance).toHaveBeenCalled()
        expect(mockApiGetQuestionQset).toHaveBeenCalled()

        expect(await rendered.queryByText('Saved!')).toBeTruthy()

        // URL hash should be updated with new instance ID
        expect(window.location.hash).toEqual(`#${widgetInstance.id}`)
    })

    it('should show alert dialog if save canceled', async () => {
        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'cancelSave',
                data: [{msg: "we're doing testing", halt: true}]
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        const saveDraftButton = await rendered.queryByText('Save Draft')
        fireEvent.click(saveDraftButton);

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        expect(await rendered.queryByText('Can Not Save!')).toBeTruthy()
        expect(await rendered.queryByText("Unfortunately, your progress was not saved because we're doing testing. Any unsaved progress will be lost.")).toBeTruthy()
    })

    it('should save new widget after clicking preview', async () => {
        // Reset to new widget
        window.location.hash = ''
        // Mock window.open function
        window.open = jest.fn()

        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'save',
                data: [widgetInstance.name, qset, 1]
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        const previewButton = await rendered.queryByText('Preview')
        fireEvent.click(previewButton);

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Initialize instance of widget
        expect(window.location.hash).toEqual(`#${widgetInstance.id}`)
        // Open preview in new tab
        expect(window.open).toBeCalled()
    })
})