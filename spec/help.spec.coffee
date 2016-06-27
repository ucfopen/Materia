setup = require('./_setup')

describe 'Help Page', ->
	client = null

	beforeEach ->
		unless client
			client = setup.getClient()

	it 'should redirect to login when not logged in', (done) ->
		client
			.url("#{setup.url}/help")
			.getTitle (err, title) -> expect(title).toBe('Help | Materia')
			.getText '.page h1', (err, title) ->  expect(title).toBe('Help & Support')
			.call(done)
			.end(done)

