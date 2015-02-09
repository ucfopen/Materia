setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it ' my-widgets should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .call(done)

describe 'My Widgets Page', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'should relocate to my widgets on author login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', setup.author.username)
            .setValue('#password', setup.author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .call(done)

    it 'should display instructions by default', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', setup.author.username)
            .setValue('#password', setup.author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .waitFor '.directions.unchosen p', 5000
            .pause 2000
            .getText '.directions.unchosen p', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Choose a widget from the list on the left.')
            .call(done)
