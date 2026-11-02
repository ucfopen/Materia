import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EmbeddedPlayer from './components/embedded-player'
import EmbeddedShell from './components/embedded-shell'
import { configureEmbeddedAuth } from './util/embedded-auth'

window.addEventListener('DOMContentLoaded', () => {
	configureEmbeddedAuth(window.EMBEDDED_ACCESS_TOKEN)
	window.EMBEDDED_ACCESS_TOKEN = null
	document.body.classList.add('embedded')
	history.replaceState(null, '', window.EMBEDDED_INSTANCE_ID
		? `/embedded/${encodeURIComponent(window.EMBEDDED_INSTANCE_ID)}/`
		: '/embedded/')
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	createRoot(document.getElementById('app')).render(
		<QueryClientProvider client={queryClient}>
			{window.EMBEDDED_INSTANCE_ID
				? <EmbeddedPlayer instanceId={window.EMBEDDED_INSTANCE_ID} />
				: <EmbeddedShell />}
		</QueryClientProvider>
	)
}, { once: true })
