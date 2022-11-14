import React from 'react'
import { render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "react-query"

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, },
    },
  })

export const renderWithClient = async (ui) => {
  const testQueryClient = createTestQueryClient()

  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  )

  // let rendered;
  // await waitFor(() => {
  //   rendered = render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>)
  // })
  // const { rerender, ...result } = rendered;

  return {
    ...result,
    rerender: (rerenderUi) => rerender(
      <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>
    ),
  }
}

export const createWrapper = () => {
  const testQueryClient = createTestQueryClient()
  return ({ children }) => (
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  )
}