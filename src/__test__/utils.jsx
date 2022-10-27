import React from 'react'
import { rest } from "msw"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "react-query"
import apiGetUserResult from '../__test__/mockapi/apiGetUser.json'
import widgetsInstances from '../__test__/mockapi/paginate_widget_instances_get.json'
import apiGetUserPermsForInstance from '../__test__/mockapi/api_Get_User_Perms_ForInstance_Result.json'


export const handlers = [
  rest.get("*/widget_paginate_instances_get/*", (req, res, ctx) => {
    // req, an information about a matching request;
    // res, a functional utility to create the mocked response;
    // ctx, a group of functions that help to set a status code, headers, body, etc.of the mocked response.

    const testVar = req.url.pathname
    console.log(testVar)
    return res(
      ctx.status(200),
      ctx.json(widgetsInstances)
    )
  }),
  rest.post("*/user_get", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(apiGetUserResult)
    )
  }),
  rest.post("*/permissions_get", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(apiGetUserPermsForInstance)
    )
  }),
]

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, },
    },
  })

export const renderWithClient = (ui) => {
  const testQueryClient = createTestQueryClient()
  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  )
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