import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act } from 'react-dom/test-utils';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import WidgetPlayer from './widget-player'
import WidgetPlayerPage from './widget-player-page'

import * as api from '../util/api'

import instance from '../__test__/mockapi/crossword_demo_instance.json'
import widgetDetails from '../__test__/mockapi/widgets_get.json'
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

describe('Widget Player Page', () => {

    it('should render', async () => {
		let rendered;

		await act(async () => {
			rendered = await renderWithClient(<WidgetPlayerPage />)
		})

		expect(rendered.container).not.toBeEmptyDOMElement()
	})
	
})

describe('Widget Player', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should render', async () => {
		jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(instance)
		jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(qset)

		await act(async () => {
			renderWithClient(<WidgetPlayer instanceId={instance.id} playId={""} minHeight={window.WIDGET_HEIGHT} minWidth={window.WIDGET_WIDTH} widgetURL={window.WIDGET_URL}/>)
		})

		expect(await screen.findByTitle('Widget Embed')).toHaveAttribute('src', expect.stringContaining(`${window.WIDGET_URL + instance.widget.dir + instance.widget.player}?${instance.widget.created_at}`));
		expect(await screen.findByTitle('Widget Embed')).not.toBeNull()

		// console.log(window._resourceLoader)
		// To test iframe contents, must add to package.json:
			// "testEnvironmentOptions": {
			// 	"resources": "usable"
			//   }
		// Currently erroring due to resourceLoader._strictSSL being set to true. Need to reconfigure jest environment to set to false
	})

	it('should render demo', async () => {
		jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(instance)
		jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(qset)

		await act(async () => {
			renderWithClient(<WidgetPlayer instanceId={window.DEMO_ID} playId={""} minHeight={window.WIDGET_HEIGHT} minWidth={window.WIDGET_WIDTH} widgetURL={window.WIDGET_URL}/>)
		})

		expect(await screen.findByTitle('Widget Embed')).not.toBeNull()
	})

	it('should fail if instance is undefined', async () => {
		jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(undefined)
		jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(qset)
		jest.spyOn(window, 'alert').mockImplementation(() => {});

		await act(async () => {
			await renderWithClient(<WidgetPlayer instanceId={instance.id} playId={""} minHeight={window.WIDGET_HEIGHT} minWidth={window.WIDGET_WIDTH} widgetURL={window.WIDGET_URL}/>)
		})

		expect(window.alert).toBeCalled()
	})

	it('should fail if qset is undefined', async () => {
		jest.spyOn(api, 'apiGetWidgetInstance').mockResolvedValue(instance)
		jest.spyOn(api, 'apiGetQuestionSet').mockResolvedValue(undefined)
		jest.spyOn(window, 'alert').mockImplementation(() => {});

		await act(async () => {
			await renderWithClient(<WidgetPlayer instanceId={instance.id} playId={""} minHeight={window.WIDGET_HEIGHT} minWidth={window.WIDGET_WIDTH} widgetURL={window.WIDGET_URL}/>)
		})

		expect(window.alert).toBeCalled()
	})
})