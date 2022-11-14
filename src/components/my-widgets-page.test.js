import React from 'react'
import '@testing-library/jest-dom'
import { renderWithClient } from '../__test__/utils'
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'

import * as api from '../util/api'
import MyWidgetsPage from './my-widgets-page'
import apiGetUserResult from '../__test__/mockapi/apiGetUser.json'
import widgetsInstances from '../__test__/mockapi/paginate_widget_instances_get.json'
import apiGetUserPermsForInstance from '../__test__/mockapi/api_Get_User_Perms_ForInstance_Result.json'

jest.mock("./header", () => () => {
  return <mock-Header data-testId="mockHeader" />
})

jest.mock("./bar-graph", () => () => {
  return <mock-BarGraph data-testid="mockBarGraph" />
})

jest.mock('./my-widgets-settings-dialog', () => () => {
  return <mock-MyWidgetsSettingsDialog data-testid='mockMyWidgetsSettingsDialog' />
})

let mockCanEditData = {
  can_publish: true,
  is_locked: false,
  msg: null,
}

let mockApiGetUser
let mockWidgetInst
let mockApiGetUserPermsForInstance
let mockApiGetScoreSummary
let mockApiCanEditWidgets

describe('MyWidgetsPage', () => {

  beforeAll(() => {
    mockApiGetUser = jest.spyOn(api, 'apiGetUser').mockResolvedValue(apiGetUserResult)
    mockWidgetInst = jest.spyOn(api, 'apiGetWidgetInstances').mockResolvedValue(widgetsInstances)
    mockApiGetUserPermsForInstance = jest.spyOn(api, 'apiGetUserPermsForInstance').mockResolvedValue(apiGetUserPermsForInstance)
    mockApiCanEditWidgets = jest.spyOn(api, 'apiCanEditWidgets').mockResolvedValue(mockCanEditData)
    mockApiGetScoreSummary = jest.spyOn(api, 'apiGetScoreSummary').mockResolvedValue([])
  })

  beforeEach(() => {
    cleanup()
    mockApiGetUser.mockResolvedValue(apiGetUserResult)
    mockWidgetInst.mockResolvedValue(widgetsInstances)
    mockApiGetUserPermsForInstance.mockResolvedValue(apiGetUserPermsForInstance)
    mockApiCanEditWidgets.mockResolvedValue(mockCanEditData)
    mockApiGetScoreSummary.mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('render sidebar with data', async () => {

    let rendered
    await act(async () => {
      rendered = await renderWithClient(<MyWidgetsPage />)
    })

    expect(rendered.getByText('test14 test (1)', { exact: true }))
    expect(rendered.getByText('play-logs-paginate', { exact: true }))
    expect(rendered.getByText('My labeling widget', { exact: true }))
  })

  it('render on widget inst selected', async () => {

    let rendered
    await act(async () => {
      rendered = await renderWithClient(<MyWidgetsPage />)
    })

    let widgetInst = rendered.getByText('test14 test (1)', { exact: true })
    fireEvent.click(widgetInst)
    expect(await rendered.findByRole('heading', { level: 1, name: 'test14 test (1) Widget', exact: true }))

    widgetInst = rendered.getByText('play-logs-paginate', { exact: true })
    fireEvent.click(widgetInst)
    expect(await rendered.findByRole('heading', { level: 1, name: 'play-logs-paginate Widget', exact: true }))

    widgetInst = rendered.getByText('My labeling widget', { exact: true })
    fireEvent.click(widgetInst)
    expect(await rendered.findByRole('heading', { level: 1, name: 'My labeling widget Widget', exact: true }))
  })

  it('render widget inst options', async () => {

    let rendered
    await act(async () => {
      rendered = await renderWithClient(<MyWidgetsPage />)
    })

    let widgetInst = rendered.getByText('test14 test (1)', { exact: true })
    fireEvent.click(widgetInst)

    expect(rendered.findByRole('heading', { level: 1, name: 'test14 test (1) Widget', exact: true }))
    expect(rendered.getByRole('link', { name: 'Preview', exact: true }))
    expect(rendered.getByRole('button', { name: 'Edit settings', exact: true }))
    expect(rendered.getByRole('link', { name: 'View all sharing options.', exact: true }))
    expect(rendered.getByDisplayValue('https://127.0.0.1/play/2Ek4W/test14-test-1'))

    const exportBtn = rendered.getByText('Export Options', { exact: true })
    expect(exportBtn)
    expect(exportBtn).toHaveClass('disabled')
  })

  it('render Settings container', async () => {
    let rendered
    await act(async () => {
      rendered = await renderWithClient(<MyWidgetsPage />)
    })

    let widgetInst = rendered.getByText('test14 test (1)', { exact: true })
    fireEvent.click(widgetInst)

    // let clickItem = rendered.getByText('Edit settings', { exact: true })
    // fireEvent.click(clickItem)

    // Looking into rendering the SETTINGS container.
    console.log(rendered.getByText('Attempts', { exact: true }))
  })

})
