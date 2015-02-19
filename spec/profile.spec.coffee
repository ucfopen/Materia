setup = require('./_setup')

describe 'When not logged in', ->
	client = null
	beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
	afterEach (done) -> client.end(done)

	it ' profile should redirect to login', (done) ->
		client
			.url('http://localhost:8080/settings')
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('Login | Materia')
			.call(done)

describe 'Profile page', ->
	client = null
	beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
	afterEach (done) -> client.end(done)

	it 'should display profile', (done) ->
		client
			.url('http://localhost:8080/profile')
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('Login | Materia')
			.setValue('#username', setup.author.username)
			.setValue('#password', setup.author.password)
			.click('form button.action_button')
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('My Widgets | Materia')
			.url('http://localhost:8080/profile')
			.getTitle (err, title) ->
				expect(err).toBeNull()
				expect(title).toBe('Profile | Materia')
			.getText '.page h2', (err, text) ->
				expect(err).toBeNull()
				expect(text).toContain('Prof Author')
			.isVisible('.avatar_big')
			.call(done)