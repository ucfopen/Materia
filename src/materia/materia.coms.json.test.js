describe('Materia.Coms.Json', () => {
	let coms
	let $q

	let mockFetchOnce = (result) => {
		fetch.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		let app = angular.module('materia')
		inject(function (_$q_) {
			$q = _$q_
		})
		global.API_LINK = 'my_api_url'
		require('../common/materia-namespace')
		require('./materia.coms.json.js')
		coms = Namespace('Materia.Coms').Json
		global.fetch = jest.fn()
	})

	it('defines expected public methods', () => {
		expect(coms.send).toBeDefined()
		expect(coms.isError).toBeDefined()
		expect(coms.post).toBeDefined()
		expect(coms.get).toBeDefined()
		expect(coms.setGateway).toBeDefined()
	})

	it('send calls fetch with expected vars', () => {
		mockFetchOnce()
		coms.send('/what/is/this', [1, 'two'])

		let a = {
			method: 'POST',
			credentials: 'same-origin',
			cache: 'no-cache',
			headers: {
				accept: 'application/json, text/javascript, */*; q=0.01',
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
			//this corresponds to the arguments we're sending above
			//we'll verify later that they're encoded properly
			body: 'data=%5B1%2C%22two%22%5D',
		}

		expect(global.fetch).toHaveBeenCalledWith('my_api_url/what/is/this/', a)
	})

	it('send defaults to API_LINK for a base url', () => {
		mockFetchOnce()
		let url = '/what/is/this'
		coms.send(url)

		expect(global.fetch).toHaveBeenCalledWith(API_LINK + url + '/', expect.anything())
	})

	it('send uses the gateway url to build requests', () => {
		mockFetchOnce()
		let url = '/what/is/this'
		coms.setGateway('new_gateway')
		coms.send(url)

		expect(global.fetch).toHaveBeenCalledWith('new_gateway' + url + '/', expect.anything())
	})

	it('send defaults data to an empty array', () => {
		mockFetchOnce()
		coms.send('/what/is/this')
		expect(global.fetch.mock.calls[0][1].body).toBe('data=%5B%5D')
	})

	it('send sanitizes dangerous characters properly', () => {
		mockFetchOnce()
		coms.send('/what/is/this', ['?=/&:'])
		expect(global.fetch.mock.calls[0][1].body).toBe('data=%5B%22%3F%3D%2F%26%3A%22%5D')
	})

	it('send returns a promise', () => {
		mockFetchOnce()
		expect(coms.send('test')).toHaveProperty('$$state')
	})

	it('get returns a promise', () => {
		mockFetchOnce()
		expect(coms.get('test')).toHaveProperty('$$state')
	})

	it('get calls fetch with expected vars', () => {
		mockFetchOnce()
		coms.get('test')

		let a = {
			method: 'GET',
			credentials: 'same-origin',
			cache: 'no-cache',
			headers: {
				accept: 'application/json;',
				'content-type': 'application/json; charset=utf-8',
			},
			body: undefined,
		}
		expect(global.fetch).toHaveBeenCalledWith('test', a)
	})

	it('post returns a promise', () => {
		mockFetchOnce()
		expect(coms.post('test')).toHaveProperty('$$state')
	})

	it('post calls fetch with expected vars', () => {
		mockFetchOnce()
		coms.post('test', { data: true })

		let a = {
			method: 'POST',
			credentials: 'same-origin',
			cache: 'no-cache',
			headers: {
				accept: 'application/json;',
				'content-type': 'application/json; charset=utf-8',
			},
			body: '{"data":true}',
		}
		expect(global.fetch).toHaveBeenCalledWith('test', a)
	})

	it('post calls fetch with expected vars', () => {
		mockFetchOnce()
		coms.post('test')
		expect(global.fetch.mock.calls[0][1]).toHaveProperty('body', '{}')
	})

	it('isError finds errors in json responses', () => {
		expect(coms.isError({ errorID: 3 })).toBe(true)
		expect(coms.isError({ errorID: undefined })).toBe(false)
		expect(coms.isError({ g: true })).toBe(false)
		expect(coms.isError(5)).toBe(false)
		expect(coms.isError()).toBe(false)
	})
})
