import React from 'react'
import {createRoot} from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import ScorePage from './components/score-page'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

const root = createRoot(document.getElementById('app'));
root.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<ScorePage />
	</QueryClientProvider>  )
