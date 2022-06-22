import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from "react-query/devtools";
import Action404 from './components/404'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

ReactDOM.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<Action404 />
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>, document.getElementById('app'))
