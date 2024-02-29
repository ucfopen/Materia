/**
 * @jest-environment jsdom
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act } from 'react-dom/test-utils';
import { render, screen, cleanup, fireEvent, waitFor, prettyDOM } from '@testing-library/react'

import WidgetPlayerPage from './widget-player-page'

import * as api from '../util/api'

import instance from '../__test__/mockapi/crossword_demo_instance.json'
import qset from '../__test__/mockapi/crossword_demo_qset.json'

jest.mock('../util/api')

// To see the DOM at any time after rendered has loaded, use:
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

describe('Widget Player Page', () => {
	let mockApiGetWidgetInstance,
	mockApiGetQuestionQset,
	mockApiSavePlayLogs,
	mockWindowAlert,
	mockApiSaveStorage

    // Setup the default mock implementations
    beforeAll(() => {
        mockApiGetWidgetInstance = jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(instance)
		mockApiGetQuestionQset = jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(qset)
		mockApiSavePlayLogs = jest.spyOn(api, 'apiSavePlayLogs').mockResolvedValue({status: 200, ok: true})
		mockApiSaveStorage = jest.spyOn(api, 'apiSavePlayStorage').mockResolvedValue({})
		mockWindowAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    })

    // Restore default values before each test
    // Setup window location pathname and hash value
    beforeEach(() => {
        mockApiGetWidgetInstance.mockResolvedValue(instance)
		mockApiGetQuestionQset.mockResolvedValue(qset)
		mockApiSavePlayLogs = jest.spyOn(api, 'apiSavePlayLogs').mockResolvedValue({status: 200, ok: true})
		mockApiSaveStorage = jest.spyOn(api, 'apiSavePlayStorage').mockResolvedValue({})

		window.PLAY_ID = 'XxSgi'
		window.DEMO_ID = 'XxSgi'

        Object.defineProperty(window, 'location', {
            value: {
				pathname: '/play/XxSgi/famous-landmarks',
				assign: (url) => window.location = url
			},
            writable: true
        });
    })

    // Because jest shares mocks between all test files
    // We need to clear mock.calls, mock.results, and mock.instances
    afterEach(() => {
        jest.clearAllMocks()
    })

	it('should render widget iframe', async () => {
        let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

		// Does the iframe have the correct src attribute?
		expect(await rendered.container.querySelector('iframe').getAttribute('src')).toBe(`${window.WIDGET_URL + instance.widget.dir + instance.widget.player}?${instance.widget.created_at}`);

		expect(mockApiGetWidgetInstance).toHaveBeenCalled();
		expect(mockApiGetQuestionQset).toHaveBeenCalled();

		// console.log(window._resourceLoader)
		// To test iframe contents, must add to package.json:
			// "testEnvironmentOptions": {
			// 	"resources": "usable"
			//   }
		// Currently erroring due to resourceLoader._strictSSL being set to true. Need to reconfigure jest environment to set to false
	})

	it('should render demo', async () => {
		window.PLAY_ID = ""

		let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

		expect(await rendered.container.querySelector('#container').getAttribute('src').includes(`${window.WIDGET_URL + instance.widget.dir + instance.widget.player}?${instance.widget.created_at}`)).toBeTruthy();
	})

	it('should send alert if instance has no id', async () => {
		let temp = instance.id;
		delete instance.id;

		let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

		expect(mockApiGetWidgetInstance).toHaveBeenCalled()
		expect(mockWindowAlert).toHaveBeenCalled()

		instance.id = temp;
	})

	// No longer sends alerts if qset is null
	// it('should send alert if qset is null', async () => {
	// 	mockApiGetQuestionQset = jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(null)

	// 	let rendered;
	// 	await act(async () => {
	// 		rendered = await renderWithClient(<WidgetPlayerPage/>)
	// 	})

	// 	expect(mockApiGetQuestionQset).toHaveBeenCalled()
	// 	expect(mockWindowAlert).toHaveBeenCalled()

	// })

	it('should not send alert if play log save succeeds', async () => {
		let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

        const e_add = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
				type: 'addLog',
				data: {
					"value": 100,
                    "text": "Everest",
                    "id": "d6643f8c-31fd-46e8-b86c-76e5be6ac215"
				}
            }
		}

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e_add, data: JSON.stringify(e_add.data)}))
        })

		// Push the log we added earlier
		// sendPendingLogs calls _sendPendingPlayLogs which calls _pushPendingLogs which calls savePlayLog
        const e_send = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                type: 'sendPendingLogs',
            }
		}

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e_send, data: JSON.stringify(e_send.data)}))
        })

		expect(mockApiSavePlayLogs).toHaveBeenCalled()
		expect(mockWindowAlert).not.toHaveBeenCalled()
	})

	it('should send alert if play log save fails', async () => {
		mockApiSavePlayLogs = jest.spyOn(api, 'apiSavePlayLogs').mockResolvedValue({halt: true, type: "error", msg: "You have been logged out, and must login again to continue"})

		let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

        const e_add = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
				type: 'addLog',
				data: {
					"value": 100,
                    "text": "Everest",
                    "id": "d6643f8c-31fd-46e8-b86c-76e5be6ac215"
				}
            }
		}

		// calls mockApiSavePlayLogs
        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e_add, data: JSON.stringify(e_add.data)}))
        })

		// Push the log we added earlier
		// sendPendingLogs calls _sendPendingPlayLogs which calls _pushPendingLogs which calls savePlayLog
        const e_send = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
                type: 'sendPendingLogs',
            }
		}

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e_send, data: JSON.stringify(e_send.data)}))
        })

		expect(mockApiSavePlayLogs).toHaveBeenCalled()
		expect(mockWindowAlert).toHaveBeenCalled()
	})

	it('should show scoresceen on end', async () => {
		let rendered;
		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage/>)
		})

		const e_end = {
            source: window,
            origin: window.BASE_URL.substring(0, window.BASE_URL.length - 1),
            data: {
				type: 'end',
				data: true // showScoreScreenAfter
            }
		}

        await act(async () => {
            window.dispatchEvent(new MessageEvent('message', {...e_end, data: JSON.stringify(e_end.data)}))
		})

		expect(mockApiSavePlayLogs).toHaveBeenCalled()
		expect(window.location).toEqual(`${window.BASE_URL}scores/${instance.id}#play-${window.PLAY_ID}`)
	})
})