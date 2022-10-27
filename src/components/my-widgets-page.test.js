import React from 'react'

import '@testing-library/jest-dom'
import { server } from '../testSetup'
import { useQuery } from 'react-query'
import { screen, getByText } from '@testing-library/react'
import { renderWithClient, createWrapper } from '../__test__/utils'

import MyWidgetsPage from './my-widgets-page'

describe('MyWidgetsPage', () => {

  it.only('render page with data', async () => {

    const result = renderWithClient(<MyWidgetsPage />)
    // console.log(await result.container.childNodes[1].childNodes[0].childNodes[0].childNodes[0])
    // console.log(result.container)
    await screen.debug()

  })
})


