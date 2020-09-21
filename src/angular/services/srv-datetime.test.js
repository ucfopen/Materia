describe('DateTimeServ', () => {
	var _service
	var mockWindow
	var mockLocationSet
	var mockLocationGet

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./srv-datetime')
		inject(function (DateTimeServ) {
			_service = DateTimeServ
		})
	})

	it('defines expected methods', () => {
		expect(_service.parseObjectToDateString).toBeDefined()
		expect(_service.parseTime).toBeDefined()
		expect(_service.fixTime).toBeDefined()
	})

	it('parseTime returns expected strings', () => {
		expect(_service.parseTime(1103155199)).toBe('11:59pm')
		expect(_service.parseTime(1103152100)).toBe('11:08pm')
		expect(_service.parseTime(1103159000)).toBe('1:03am')

		expect(_service.parseTime(1103259000)).toBe('4:50am')
		expect(_service.parseTime(1101159000)).toBe('9:30pm')
		expect(_service.parseTime(1103158800)).toBe('1:00am')
		expect(_service.parseTime(1103259600)).toBe('5:00am')
	})

	it.skip('fixTime adjusts time based on server differences', () => {
		// @TODO: this function needs to be investigated
		// I believe we should just always make sure the server is storing UTC timestamps
		// and just display them in local time via js
		// which should require 0 time zone fixing in js, just load the utc time string
	})

	it('parseObjectToDateString returns time as expedted', () => {
		expect(_service.parseObjectToDateString(1103155199)).toBe('12/15/04')
		expect(_service.parseObjectToDateString(1103259000)).toBe('12/17/04')
		expect(_service.parseObjectToDateString(1101159000)).toBe('11/22/04')
		expect(_service.parseObjectToDateString(1103158800)).toBe('12/16/04')
	})
})
