import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from "react-query/devtools";
import SettingsPage from './components/settings-page'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

ReactDOM.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<SettingsPage />
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>, document.getElementById('app'))
