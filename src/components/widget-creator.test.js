/**
 * @jest-environment jsdom
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act } from 'react-dom/test-utils';
import { render, screen, cleanup, fireEvent, waitFor, prettyDOM } from '@testing-library/react'

import WidgetCreatorPage from './widget-creator-page'

import * as api from '../util/api'

import widgetInstance from '../__test__/mockapi/crossword_demo_instance.json'
import draftWidgetInstance from '../__test__/mockapi/crossword_demo_instance_draft.json'
import widgetInfo from '../__test__/mockapi/crossword_demo_widget_info.json'
import qset from '../__test__/mockapi/crossword_demo_qset.json'

jest.mock('../util/api')

// To see the DOM at any time after rendered.container has loaded, use:
// console.log(prettyDOM(rendered.container))

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
        draftWidgetInstance.qset = qset;
        widgetInstance.qset = qset;

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
        expect(await rendered.container.querySelector('#container').getAttribute('src')).toBe(`${window.WIDGET_URL + widgetInstance.widget.dir + widgetInstance.widget.creator}?${widgetInstance.widget.created_at}`);

        // Send mock message from widget iframe indicating the creator is ready
        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'start',
                data: [widgetInstance.name, qset, 1]
            }
        }

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Publish button should be set to 'Update' since instance is published
        expect(await rendered.container.querySelector('#creatorPublishBtn').textContent.includes('Update')).toBeTruthy()
        // Save Draft should not be rendered either
        expect(await rendered.container.querySelector('#creatorSaveBtn')).toBeFalsy()
    })

    it('should render new widget instance', async () => {
        let rendered;

        mockApiGetWidgetInstance.mockResolvedValue(undefined)
		mockApiGetQuestionQset.mockResolvedValue(undefined)

        window.location.hash = ''

		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Send mock message from widget iframe indicating the creator is ready
        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'start',
                data: [widgetInstance.name, qset, 1]
            }
        }

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Action bar for unpublished widgets
        expect(await rendered.queryByText('Save History')).toBeFalsy()
        expect(await rendered.container.querySelector('#creatorPublishBtn').textContent.includes('Publish...')).toBeTruthy()
        expect(await rendered.container.querySelector('#creatorSaveBtn').textContent.includes('Save Draft')).toBeTruthy()
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
        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe(`${window.BASE_URL}qsets/import/?inst_id=${widgetInstance.id}`)

        // Select a qset from save history
        act(() => {
            window.Materia.Creator.onQsetHistorySelectionComplete(JSON.stringify(qset));
        })

        // Hide action bar
        expect(await rendered.container.querySelector("#action_bar")).toBeFalsy()

        // Hide embed dialog
        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe("")

        const actionBar = await rendered.container.querySelector("#qset-rollback-confirmation-bar")

        expect(actionBar).toBeTruthy()

        // Press 'Keep' button to keep the selected qset
        const keepButton = await actionBar.querySelector("button");
        fireEvent.click(keepButton);

        expect(await rendered.container.querySelector("#qset-rollback-confirmation-bar")).toBeFalsy()
        // Shows action bar
        expect(await rendered.container.querySelector("#action-bar")).toBeTruthy()

    })

    it('embeds the question importer', async () => {
        let rendered;

        await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Import Questions
        const importQuestionsLink = await rendered.container.querySelector('#importLink');
        fireEvent.click(importQuestionsLink)

        // Embed the question importer
        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe(`${window.BASE_URL}questions/import/?type=${encodeURIComponent(widgetInfo.meta_data.supported_data.join())}`)

        // Import a question
        act(() => {
            window.Materia.Creator.onQuestionImportComplete(JSON.stringify(qset.data.items[0].items));
        })

        // Hide the question importer
        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe("")

    })

    it('displays popup on publish pressed', async () => {
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Publish
        const publishButton = await rendered.container.querySelector('#creatorPublishBtn')
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
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)

        let rendered;
		await act(async () => {
            rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Publish
        const publishButton = await rendered.container.querySelector('#creatorPublishBtn')
        fireEvent.click(publishButton)

        // Get warning
        expect(await rendered.queryByText('Publishing removes the "Draft" status of a widget, which grants you the ability to use it in your course and collect student scores & data.')).toBeTruthy()

        // Continue publish
        const yesPublish = await rendered.container.querySelector('.action_button')
        fireEvent.click(yesPublish)

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
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)

        mockApiCanBePublishedByCurrentUser.mockResolvedValue(false)

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Click Publish
        const publishButton = await rendered.container.querySelector('#creatorPublishBtn')
        fireEvent.click(publishButton)

        // Get warning
        expect(await rendered.queryByText('Students are not allowed to publish this widget.')).toBeTruthy()

        // Cancel publish
        const cancelPublishButton = await rendered.container.querySelector('.cancel_button')
        fireEvent.click(cancelPublishButton)

        // Remove warning
        expect(await rendered.queryByText('Students are not allowed to publish this widget.')).toBeFalsy()
    })

    it('displays popup on update pressed', async () => {
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // Sets creatorReady to true
        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'start',
                data: [widgetInstance.name, qset, 1]
            }
        }

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Click Update
        const updateButton = await rendered.container.querySelector("#creatorPublishBtn")
        expect(updateButton.textContent.includes('Update')).toBeTruthy()
        fireEvent.click(updateButton)

        // Show warning
        expect(await rendered.queryByText('Updating this published widget will instantly allow your students to see your changes.')).toBeTruthy()

        // Cancel publish
        const cancelPublishButton = await rendered.container.querySelector('.cancel_button')
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

    // Disabling this test since qset should not require permissions
    // it('should error if user does not have correct permissions to access qset', async () => {
    //     let rendered;

    //     mockApiGetQuestionQset.mockResolvedValue({title: 'Permission Denied'})

	// 	await act(async () => {
	// 		rendered = await renderWithClient(<WidgetCreatorPage/>)
    //     })

    //     // Render alert dialog
    //     expect(await rendered.queryByText('Permission Denied')).toBeTruthy()
    //     // Render No Permission page
    //     expect(await rendered.queryByText("You don't have permission to view this page.")).toBeTruthy()
    //     // Render Support Info
    //     expect(await rendered.queryByText("Trouble Logging In?")).toBeTruthy()
    // })

    it('should display alert dialog if qset cannot be loaded', async () => {
        mockApiGetQuestionQset.mockResolvedValue({title: 'error'})

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // expect(await rendered.queryByText('Unable to load widget data.')).toBeTruthy()
        expect(await rendered.container.querySelector('.alert-wrapper')).toBeTruthy()
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

        expect(await rendered.queryByText('You are no longer logged in, please login again to continue.')).toBeTruthy()
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

        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe(`${window.BASE_URL}media/import#${types.join(',')}`)

        // Import media
        const file = new File([""], "filename", {});
        act(() => {
            window.Materia.Creator.onMediaImportComplete(file);
        })

        // Hide embed dialog
        expect(await rendered.container.querySelector("#embed_dialog").getAttribute('src')).toBe("")

    })

    it('should save draft of new widget', async () => {
        mockApiGetWidgetInstance.mockResolvedValue(draftWidgetInstance)
        mockApiSaveWidget.mockResolvedValue(draftWidgetInstance)

        window.location.hash = ''

        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'save',
                data: [draftWidgetInstance.name, qset, 1]
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        // New widgets don't have instances or qsets
        expect(mockApiGetWidgetInstance).not.toHaveBeenCalled()
        expect(mockApiGetQuestionQset).not.toHaveBeenCalled()
        expect(mockApiGetWidget).toHaveBeenCalled()

        const saveDraftButton = await rendered.container.querySelector('#creatorSaveBtn')
        fireEvent.click(saveDraftButton);
        expect(await rendered.container.querySelector('#creatorSaveBtn').textContent.includes('Saving...')).toBeTruthy()

        // Save widget
        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })
        expect(mockApiSaveWidget).toHaveBeenCalled()

        // URL hash should be updated with new instance ID
        expect(window.location.hash).toEqual(`#${draftWidgetInstance.id}`)
    })

    it('should show alert dialog if save canceled', async () => {
        const error_msg = "we're doing testing";

        const e = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                source: 'creator-core',
                type: 'cancelSave',
                data: [{msg: error_msg, halt: true}]
            }
        }

        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetCreatorPage/>)
        })

        const saveButton = await rendered.container.querySelector('#creatorPublishBtn')
        fireEvent.click(saveButton);

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e, data: JSON.stringify(e.data)}))
        })

        // Removed
        // expect(await rendered.queryByText('Can Not Save!')).toBeTruthy()
        expect(await rendered.queryByText(`Unfortunately, your progress was not saved because ${error_msg}. Any unsaved progress will be lost.`)).toBeTruthy()
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

        const previewButton = await rendered.container.querySelector('#creatorPreviewBtn')
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