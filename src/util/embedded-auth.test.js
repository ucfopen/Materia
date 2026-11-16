/**
 * @jest-environment jsdom
 */
import { configureEmbeddedAuth, embeddedRequestOptions, reportEmbeddedAuthError } from './embedded-auth'
import { handleRequest } from './api'

class TestHeaders {
	constructor(headers = {}) {
		this.values = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
	}
	delete(key) { this.values.delete(key.toLowerCase()) }
	set(key, value) { this.values.set(key.toLowerCase(), value) }
	get(key) { return this.values.get(key.toLowerCase()) ?? null }
}

beforeAll(() => { global.Headers = TestHeaders })

test('first-party request options are unchanged before embedded configuration', () => {
	const options = { credentials: 'include', headers: { 'X-CSRFToken': 'csrf' } }
	expect(embeddedRequestOptions('/api/instances/', options)).toBe(options)
})

test('embedded reads and writes use bearer without cookies or csrf', () => {
	configureEmbeddedAuth('launch-token')
	const options = embeddedRequestOptions('/api/embedded/play/', {
		method: 'POST',
		credentials: 'include',
		headers: { 'X-CSRFToken': 'csrf', 'content-type': 'application/json' }
	})
	expect(options.credentials).toBe('omit')
	expect(options.mode).toBe('same-origin')
	expect(options.headers.get('Authorization')).toBe('Bearer launch-token')
	expect(options.headers.get('X-CSRFToken')).toBeNull()
	expect(options.headers.get('content-type')).toBe('application/json')
	expect(embeddedRequestOptions('/api/scores/').headers.get('Authorization')).toBe('Bearer launch-token')
})

test('guest requests omit both bearer and cookies', () => {
	configureEmbeddedAuth(null)
	const options = embeddedRequestOptions('/api/embedded/play/')
	expect(options.credentials).toBe('omit')
	expect(options.headers.get('Authorization')).toBeNull()
})

test('embedded writes do not read cookies even when cookie access is unavailable', async () => {
	configureEmbeddedAuth('launch-token')
	const cookie = jest.spyOn(document, 'cookie', 'get').mockImplementation(() => {
		throw new Error('Cookie access blocked')
	})
	global.fetch = jest.fn().mockResolvedValue({
		ok: true,
		status: 200,
		headers: { get: () => 'application/json' },
		json: async () => ({ success: true })
	})
	try {
		await expect(handleRequest('POST', '/api/embedded/play/', {})).resolves.toEqual({ success: true })
		expect(cookie).not.toHaveBeenCalled()
		expect(fetch.mock.calls[0][1].credentials).toBe('omit')
	} finally {
		cookie.mockRestore()
	}
})

test('tokens cannot be attached to another origin or non-API URL', () => {
	configureEmbeddedAuth('launch-token')
	for (const url of ['https://other.example/api/', '/login/', '//other.example/api/']) {
		expect(() => embeddedRequestOptions(url)).toThrow('Materia API')
	}
})

test('unauthorized responses notify the shell instead of navigating to login', () => {
	const listener = jest.fn()
	window.addEventListener('materia-embedded-auth-error', listener)
	reportEmbeddedAuthError({ status: 403 })
	expect(listener).not.toHaveBeenCalled()
	const error = { status: 401 }
	reportEmbeddedAuthError(error)
	expect(listener.mock.calls[0][0].detail).toBe(error)
	window.removeEventListener('materia-embedded-auth-error', listener)
})
