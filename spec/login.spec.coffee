setup = require('./_setup')

describe 'Login Page', ->
    client = null
    beforeEach -> client = setup.getClient()
    afterEach (done) -> client.end(done)

    it 'should display an error on incorrect login', (done) ->
        client
            .url("#{setup.url}/login")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .getText '.detail .subtitle', (err, text) -> expect(text).toContain('Using your')
            .click('form button.action-button')
            .isVisible('.error')
            .getText '.error', (err, text) -> expect(text).toBe('ERROR: Username and/or password incorrect.')
            .call(done)

    it 'should relocate to my widgets on author login', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/login"
        client
            .waitForPageVisible '.my-widgets', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .call(done)

    it 'should relocate to my profile on student login', (done) ->
        setup.loginAt client, setup.student, "#{setup.url}/login"
        client
            .waitForPageVisible '.content', 5000
            .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
            .call(done)

    it 'should display user info in header', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/login"
        client
            .waitForPageVisible '.my-widgets', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .getText '.user', (err, text) -> expect(text).toBe('Welcome ' + setup.author.name)
            .getText '.logout', (err, text) -> expect(text).toBe('Logout')
            .isVisible('.user.avatar')
            .call(done)
