let embedded = false
let accessToken = null

export const isEmbeddedAuth = () => embedded

export const configureEmbeddedAuth = token => {
	embedded = true
	accessToken = token || null
}

// modifies fetch options object if we're operating in an embedded context
// removes CSRF headers and appends the authorization header with the provided access token
export const embeddedRequestOptions = (url, options = {}) => {
	if (!embedded) return options
	const target = new URL(url, window.location.href)
	if (target.origin !== window.location.origin || !target.pathname.startsWith('/api/')) {
		throw new Error('Embedded requests must use the Materia API.')
	}
	const headers = new Headers(options.headers)
	headers.delete('X-CSRFToken')
	headers.delete('Authorization')
	if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
	return { ...options, credentials: 'omit', mode: 'same-origin', headers }
}

export const reportEmbeddedAuthError = error => {
	if (embedded && error.status === 401) {
		window.dispatchEvent(new CustomEvent('materia-embedded-auth-error', { detail: error }))
	}
}
