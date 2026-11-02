/**
 * @jest-environment jsdom
 */
import { createRoot } from 'react-dom/client'
import { configureEmbeddedAuth } from './util/embedded-auth'

jest.mock('react-dom/client', () => ({
	createRoot: jest.fn(() => ({ render: jest.fn() }))
}))
jest.mock('./util/embedded-auth', () => ({ configureEmbeddedAuth: jest.fn() }))
jest.mock('./components/embedded-player', () => () => null)
jest.mock('./components/embedded-shell', () => () => null)

test('bootstraps from non-configurable template globals without deleting them', () => {
	document.body.innerHTML = '<div id="app"></div>'
	Object.defineProperty(window, 'EMBEDDED_ACCESS_TOKEN', {
		value: 'bootstrap-token', writable: true, configurable: false
	})
	window.EMBEDDED_INSTANCE_ID = 'embed123'
	require('./embedded-player')
	window.dispatchEvent(new Event('DOMContentLoaded'))
	window.dispatchEvent(new Event('DOMContentLoaded'))
	expect(configureEmbeddedAuth).toHaveBeenCalledWith('bootstrap-token')
	expect(window.EMBEDDED_ACCESS_TOKEN).toBeNull()
	expect(createRoot.mock.results[0].value.render).toHaveBeenCalledTimes(1)
	expect(window.location.pathname).toBe('/embedded/embed123/')
})
