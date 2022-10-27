import React from 'react'

import '@testing-library/jest-dom'
import { server } from '../testSetup'
import { useQuery } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'

import { screen, getByText } from '@testing-library/react'
import { renderWithClient, createWrapper } from '../__test__/utils'

import MyWidgetsPage from './my-widgets-page'
import widgetsInstances from '../__test__/mockapi/paginate_widget_instances_get.json'

const useCustomHook = ({ queryKey, queryData }) => {
  return useQuery([queryKey], () => queryData)
}

describe('MyWidgetsPage', () => {

  it.only('render page with data', async () => {

    const result = renderWithClient(<MyWidgetsPage />)
    console.log(result.container)
    await result.debug()




  })
})


