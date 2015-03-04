setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach ->
        unless client
            client = setup.webdriver.remote(setup.webdriverOptions).init()

    it ' profile should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .call(done)


    it 'should display profile', (done) ->
        setup.loginAt client, setup.author, 'http://localhost:8080/profile'
        client
            .waitForVisible '.container', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .url('http://localhost:8080/profile')
            .waitForVisible '.user_type', 5000
            .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
            .getText '.page h2', (err, text) -> expect(text).toContain('Prof Author')
            .isVisible('.avatar_big')
            .call(done)
            .end(done)