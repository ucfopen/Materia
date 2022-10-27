import { setupServer } from 'msw/node'
import { setLogger } from 'react-query'
import { handlers } from './__test__/utils'
import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
require('angular/angular.js')
require('angular-mocks/angular-mocks.js')

export const server = setupServer(...handlers)

configure({ adapter: new Adapter() })

// global.MSW_SERVER = setupServer(...handlers)
global.API_LINK = '/api/'
global.BASE_URL = 'https://test_base_url.com/'
global.WIDGET_URL = 'widget_url/'
global.STATIC_CROSSDOMAIN = 'https://crossdomain.com/'
global.MEDIA_URL = 'https://mediaurl.com/'

global.testResetAngular = () => {
	jest.resetModules()
	angular.mock.module('materia')
	angular.module('materia', [])
}

global.resetNamespace = () => {
	if (window["Materia"]) { window["Materia"] = null }
}

global.getMockApiData = (type) => {
	return require(`./__test__/mockapi/${type}.json`)
}

beforeEach(() => { testResetAngular(); resetNamespace(); });

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

setLogger({
	log: console.log,
	warn: console.warn,
	error: () => { }
})