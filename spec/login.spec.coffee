setup = require('./_setup')

describe 'Login Page', ->
    client = null
    client = setup.getClient()

    it 'should display an error on incorrect login', (done) ->
        client
            .url("#{setup.url}/login")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .getText '.detail .subtitle', (err, text) -> expect(text).toContain('Using your')
            .click('form button.action_button')
            .isVisible('.error')
            .getText '.error', (err, text) -> expect(text).toBe('ERROR: Username and/or password incorrect.')
            .call(done)

    it 'my-widgets should redirect to login', (done) ->
        client
            .url("#{setup.url}/settings")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .call(done)

    it 'should relocate to my widgets on author login', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/login"
        client
            .waitForPageVisible '.container', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .click '.logout a'
            .pause 100
            .call(done)

    it 'should relocate to my profile on student login', (done) ->
        setup.loginAt client, setup.student, "#{setup.url}/login"
        client
            .waitForPageVisible '.user_type', 5000
            .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
            .click '.logout a'
            .pause 100
            .call(done)

    it 'should display user info in header', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/login"
        client
            .waitForPageVisible '.container', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .getText '.user', (err, text) -> expect(text).toBe('Welcome ' + setup.author.name)
            .getText '.logout', (err, text) -> expect(text).toBe('Logout')
            .isVisible('.user.avatar')
            .click '.logout a'
            .pause 100
            .call(done)
