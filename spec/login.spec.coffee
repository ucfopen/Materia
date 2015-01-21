setup = require('./_setup')

describe 'Login Page', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'should display an error on incorrect login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .getText '.detail .subtitle', (err, text) ->
                expect(err).toBeNull()
                expect(text).toContain('Using your')
            .click('form button.action_button')
            .isVisible('.error')
            .getText '.error', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('ERROR: Username and/or password incorrect.')
            .call(done)

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

    it 'should relocate to my profile on student login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', setup.student.username)
            .setValue('#password', setup.student.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Profile | Materia')
            .call(done)

    it 'should display user info in header', (done) ->
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
            .getText '.user', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Welcome Prof Author')
            .getText '.logout', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Logout')
            .isVisible('.user.avatar')
            .call(done)
