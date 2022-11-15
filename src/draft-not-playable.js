import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from "react-query/devtools";
import DraftNotPlayable from './components/draft-not-playable'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

ReactDOM.render(
	<QueryClientProvider client={queryClient} contextSharing={true}>
		<DraftNotPlayable />
		<ReactQueryDevtools initialIsOpen={false} />
	</QueryClientProvider>, document.getElementById('app'))
