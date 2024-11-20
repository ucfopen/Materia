import React from 'react'
import {createRoot} from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import MyWidgetsPage from './components/my-widgets-page'
import { onError } from './util/global-cache-options'

const queryCache = new QueryCache({
	onError
})

export const queryClient = new QueryClient({ queryCache })

const root = createRoot(document.getElementById('app'));
root.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<MyWidgetsPage />
	</QueryClientProvider>  
)
