setup = require('./_setup')

describe 'Homepage', ->
	client = null

	beforeEach ->
		unless client
			client = setup.getClient()

	it 'should display correctly', (done) ->
		client
			.url("#{setup.url}/")
			.getTitle (err, title) -> expect(title).toBe('Welcome to Materia | Materia')
			.execute 'return $(".main_container article").length;', null, (err, result) -> expect(result.value).toBeGreaterThan(0)
			.click('.span_next:last-child')
			.call(done)
			.end(done)

