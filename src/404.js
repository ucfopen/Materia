import React from 'react'
import {createRoot} from "react-dom/client"
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools';
import Action404 from './components/404'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

const root = createRoot(document.getElementById('app'));
root.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<Action404 />
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>  )
