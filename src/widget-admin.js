import React from 'react'
import {createRoot} from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import WidgetAdminPage from './components/widget-admin-page'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

const root = createRoot(document.getElementById('app'));

root.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<WidgetAdminPage />
    </QueryClientProvider>
)
