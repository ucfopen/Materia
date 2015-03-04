setup = require('./_setup')

describe 'Help Page', ->
    client = null
    beforeEach -> client = setup.webdriver.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'should redirect to login when not logged in', (done) ->
        client
            .url('http://localhost:8080/help')
            .getTitle (err, title) -> expect(title).toBe('Help | Materia')
            .getText '.page h1', (err, title) ->  expect(title).toBe('Help & Support')
            .call(done)
