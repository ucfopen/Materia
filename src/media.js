import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import MediaImporter from './components/media-importer'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({ queryCache })

ReactDOM.render(
  <QueryClientProvider client={queryClient} contextSharing={true}>
    <MediaImporter />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>, document.getElementById('app'))