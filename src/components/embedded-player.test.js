/**
 * @jest-environment jsdom
 */
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import EmbeddedPlayer from './embedded-player'
import { handleRequest } from '../util/api'

jest.mock('../util/api', () => ({ handleRequest: jest.fn() }))
jest.mock('./widget-player', () => ({ playId, onComplete }) => (
	<button onClick={onComplete}>Finish {playId}</button>
))
jest.mock('./scores', () => ({ playID, userID, onPlayAgain }) => (
	<div>
		<span>Scores {playID} user {userID ?? 'anonymous'}</span>
		<button onClick={onPlayAgain}>Play Again</button>
	</div>
))

const renderShell = () => render(
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<EmbeddedPlayer instanceId="embed123" />
	</QueryClientProvider>
)

beforeEach(() => { jest.clearAllMocks() })

test.each([123, null])('play, scores and play again stay inside the shell for user %s', async userId => {
	handleRequest
		.mockResolvedValueOnce({ playId: 'first', userId, contextId: userId ? 'course' : null })
		.mockResolvedValueOnce({ playId: 'second', userId, contextId: userId ? 'course' : null })
	renderShell()
	expect(handleRequest).not.toHaveBeenCalled()
	fireEvent.click(screen.getByText('Play Widget'))
	fireEvent.click(await screen.findByText('Finish first'))
	await screen.findByText(`Scores first user ${userId ?? 'anonymous'}`)
	window.location.hash = '#attempt-1'
	fireEvent.click(screen.getByText('Play Again'))
	await screen.findByText('Finish second')
	expect(window.location.hash).toBe('')
	expect(handleRequest).toHaveBeenNthCalledWith(2, 'POST', '/api/embedded/play/', { instanceId: 'embed123' })
})

test('missing or expired launch produces explicit relaunch instructions', async () => {
	handleRequest.mockRejectedValueOnce({ status: 401 })
	renderShell()
	fireEvent.click(screen.getByText('Play Widget'))
	await screen.findByText('Please relaunch this widget')
	expect(screen.queryByText('Play Again')).toBeNull()
})

test('API initialization errors are visible and do not start a player', async () => {
	handleRequest.mockRejectedValueOnce(new Error('This widget is currently closed.'))
	renderShell()
	fireEvent.click(screen.getByText('Play Widget'))
	await screen.findByText('This widget is currently closed.')
})

test('expiry during play replaces the player with relaunch instructions', async () => {
	handleRequest.mockResolvedValueOnce({ playId: 'first', userId: 123 })
	renderShell()
	fireEvent.click(screen.getByText('Play Widget'))
	await screen.findByText('Finish first')
	fireEvent(window, new CustomEvent('materia-embedded-auth-error', { detail: { status: 401 } }))
	await waitFor(() => expect(screen.queryByText('Finish first')).toBeNull())
	await screen.findByText('Please relaunch this widget')
})
