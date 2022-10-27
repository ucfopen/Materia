import React from 'react'
// import msw
import axios from 'axios'
import '@testing-library/jest-dom'
import { renderHook } from '@testing-library/react-hooks'
import { render, screen, getByText } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import MyWidgetsPage from './my-widgets-page'


const widgetsInstances = {
  total_num_pages: 1,
  pagination: [
    /* play-logs-paginate*/
    {
      attempts: "-1",
      clean_name: "play-logs-paginate",
      close_at: "-1",
      created_at: "1662490012",
      embed_url: "https://127.0.0.1/embed/VRNgW/play-logs-paginate",
      embedded_only: false,
      guest_access: false,
      height: 0,
      id: "VRNgW",
      is_deleted: false,
      is_draft: false,
      is_embedded: false,
      is_student_made: false,
      name: "play-logs-paginate",
      open_at: "-1",
      play_url: "https://127.0.0.1/play/VRNgW/play-logs-paginate",
      preview_url: "https://127.0.0.1/preview/VRNgW/play-logs-paginate",
      published_by: null,
      qset: { version: null, data: null },
      student_access: false,
      user_id: "5",
      widget: {
        api_version: "2",
        clean_name: "labeling",
        created_at: "1661283013",
        creator: "creator.html",
        creator_guide: "guides/creator.html",
        dir: "5-labeling/",
        flash_version: "10",
        height: "601",
        id: "5",
        in_catalog: "1",
        is_answer_encrypted: "1",
        is_editable: "1",
        is_playable: "1",
        is_qset_encrypted: "1",
        is_scalable: "0",
        is_scorable: "1",
        is_storage_enabled: "0",
        meta_data: {
          about: "In the Labeling widget, students will need to correctly place the labels that you create and add to an image of your choice. They will receive a score depending on how many correct placements they make.",
          demo: "2wM7c",
          excerpt: "A quiz tool which requires students to correctly identify certain parts of an image by placing labels.",
          features: ["Customizable", "Scorable", "Media", "Mobile Friendly"],
          supported_data: ["Question/Answer"],
        },
        name: "Labeling",
        package_hash: "9079221629921a4661d07253ee7c6334",
        player: "player.html",
        player_guide: "guides/player.html",
        question_types: "",
        restrict_publish: "0",
        score_module: "Labeling",
        score_screen: "",
        width: "800",
      },
      width: "800",
    },

    /* my-labeling-widget */
    {
      attempts: "-1",
      clean_name: "my-labeling-widget",
      close_at: "-1",
      created_at: "1662489805",
      embed_url: "",
      embedded_only: false,
      guest_access: false,
      height: 0,
      id: "u5wRs",
      is_deleted: false,
      is_draft: true,
      is_embedded: false,
      is_student_made: false,
      name: "My labeling widget",
      open_at: "-1",
      play_url: "",
      preview_url: "https://127.0.0.1/preview/u5wRs/my-labeling-widget",
      published_by: null,
      qset: { version: null, data: null },
      student_access: false,
      user_id: "5",
      widget: {
        api_version: "2",
        clean_name: "labeling",
        created_at: "1661283013",
        creator: "creator.html",
        creator_guide: "guides/creator.html",
        dir: "5-labeling/",
        flash_version: "10",
        height: "601",
        id: "5",
        in_catalog: "1",
        is_answer_encrypted: "1",
        is_editable: "1",
        is_playable: "1",
        is_qset_encrypted: "1",
        is_scalable: "0",
        is_scorable: "1",
        is_storage_enabled: "0",
        meta_data: {
          about: "In the Labeling widget, students will need to correctly place the labels that you create and add to an image of your choice. They will receive a score depending on how many correct placements they make.",
          demo: "2wM7c",
          excerpt: "A quiz tool which requires students to correctly identify certain parts of an image by placing labels.",
          features: ["Customizable", "Scorable", "Media", "Mobile Friendly"],
          supported_data: ["Question/Answer"],
        },
        name: "Labeling",
        package_hash: "9079221629921a4661d07253ee7c6334",
        player: "player.html",
        player_guide: "guides/player.html",
        question_types: "",
        restrict_publish: "0",
        score_module: "Labeling",
        score_screen: "",
        width: "800"
      },
      width: 0
    },

    /* test14-test-1  */
    {
      attempts: "-1",
      clean_name: "test14-test-1",
      close_at: "-1",
      created_at: "1663693382",
      embed_url: "https://127.0.0.1/embed/2Ek4W/test14-test-1",
      embedded_only: false,
      guest_access: false,
      height: 0,
      id: "2Ek4W",
      is_deleted: false,
      is_draft: false,
      is_embedded: false,
      is_student_made: false,
      name: "test14 test (1)",
      open_at: "-1",
      play_url: "https://127.0.0.1/play/2Ek4W/test14-test-1",
      preview_url: "https://127.0.0.1/preview/2Ek4W/test14-test-1",
      published_by: null,
      qset: { version: null, data: null },
      student_access: false,
      user_id: "5",
      widget: {
        api_version: "2",
        clean_name: "labeling",
        created_at: "1661283013",
        creator: "creator.html",
        creator_guide: "guides/creator.html",
        dir: "5-labeling/",
        flash_version: "10",
        height: "601",
        id: "5",
        in_catalog: "1",
        is_answer_encrypted: "1",
        is_editable: "1",
        is_playable: "1",
        is_qset_encrypted: "1",
        is_scalable: "0",
        is_scorable: "1",
        is_storage_enabled: "0",
        meta_data: {
          about: "In the Labeling widget, students will need to correctly place the labels that you create and add to an image of your choice. They will receive a score depending on how many correct placements they make.",
          demo: "2wM7c",
          excerpt: "A quiz tool which requires students to correctly identify certain parts of an image by placing labels.",
          features: ["Customizable", "Scorable", "Media", "Mobile Friendly"],
          supported_data: ["Question/Answer"]
        },
        name: "Labeling",
        package_hash: "9079221629921a4661d07253ee7c6334",
        player: "player.html",
        player_guide: "guides/player.html",
        question_types: "",
        restrict_publish: "0",
        score_module: "Labeling",
        score_screen: "",
        width: "800"
      },
      width: 0
    },
  ],
}

const initTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: 'false' },
  }
})

/**
 * It renders a component with a test query client, and returns a rerender function that also uses the
 * test query client
 * @param children - The component you want to render.
 */
const renderWithClient = (children) => {
  const testQueryClient = initTestQueryClient()
  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  )

  return {
    ...result,
    rerender: (rerenderUi) => rerender(
      <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>
    )
  }
}

const createWrapper = () => {
  const testQueryClient = initTestQueryClient()
  return ({ children }) => {
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  }
}

const useRepoData = () => {
  return useQuery(['widgets'],)
}

// Jest's official way to mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // returned val
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('MyWidgetsPage', () => {

  beforeEach(() => {
    const div = document.createElement('div')
    div.setAttribute('id', 'modal')
    document.body.appendChild(div)
  })

  afterEach(() => {
    const div = document.getElementById('modal')
    if (div) {
      document.body.removeChild(div)
    }
  })

  // the <Header /> causes conflict at the time of testing
  it('render Loading Screen', async () => {
    const container = renderWithClient(<MyWidgetsPage />)
    expect(await container.findByText(/Loading/i)).toBeInTheDocument()
  })

  it('render Almost Done Screen', async () => {
    // test not completed
    const container = renderWithClient(<MyWidgetsPage />)
  })

  it.only('render page with data', async () => {

    // const wrapper = renderWithClient(<MyWidgetsPage />)

    const { result, waitFor } = renderHook(() => useCustomHook(), {
      wrapper: createWrapper()
    })

    wrapper.debug()
  })
})


