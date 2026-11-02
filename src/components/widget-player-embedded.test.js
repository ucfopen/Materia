/**
 * @jest-environment jsdom
 */
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, waitFor } from '@testing-library/react'
import WidgetPlayer from './widget-player'
import { apiGetWidgetInstance, apiGetQuestionSet } from '../util/api'
import instance from '../__test__/mockapi/crossword_demo_instance.json'

jest.mock('../util/api')
jest.mock('uuid', () => ({ v4: () => 'log-id' }))
jest.mock('./hooks/usePlayLogSave', () => () => ({
	mutate: ({ successFunc }) => successFunc({ success: true })
}))
jest.mock('./hooks/usePlayStorageDataSave', () => () => ({ mutate: jest.fn() }))

test('embedded player accepts widget messages, flushes end logs, and completes without navigation', async () => {
	apiGetWidgetInstance.mockResolvedValue({ ...instance, guest_access: true })
	apiGetQuestionSet.mockResolvedValue({})
	const onComplete = jest.fn()
	const url = window.location.href
	const { container } = render(
		<QueryClientProvider client={new QueryClient()}>
			<WidgetPlayer instanceId="embed123" playId="play-id" embedded={true} onComplete={onComplete} />
		</QueryClientProvider>
	)
	await waitFor(() => expect(container.querySelector('iframe')?.getAttribute('src')).toContain('player.html'))
	const frame = container.querySelector('iframe')
	const widgetMessage = type => fireEvent(window, new MessageEvent('message', {
		source: frame.contentWindow,
		origin: new URL(window.STATIC_CROSSDOMAIN).origin,
		data: JSON.stringify({ type, data: true })
	}))
	fireEvent(window, new MessageEvent('message', {
		source: window,
		origin: new URL(window.BASE_URL).origin,
		data: { subject: 'lti.frameResize', height: 600 }
	}))
	widgetMessage('start')
	widgetMessage('end')
	await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
	expect(window.location.href).toBe(url)
})
