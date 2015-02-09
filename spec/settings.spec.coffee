setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it ' settings should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .call(done)
            .call -> client.end(done)

describe 'Settings page', ->
    client = null
    beforeEach ->
        client = setup.webdriverjs.remote(setup.webdriverOptions).init()
        # Reset the profile every time
        client
            .url('http://localhost:8080/settings')
            .setValue('#username', setup.author.username)
            .setValue('#password', setup.author.password)
            .click('form button.action_button')
            .click('#avatar_default')
            .execute('document.getElementById("notify").checked = true;', null)
            .click('form button.action_button')
            .pause(500)
    afterEach (done) -> client.end(done)

    it 'should display default options', (done) ->
        client
            # Check page state
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Settings | Materia')
            .isVisible('.avatar_big')
            # save should be disabled
            .getAttribute 'form button.action_button', 'disabled', (err, disabled) ->
                expect(err).toBeNull()
                expect(disabled).toContain('true')
            .isSelected('#avatar_default')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('default-avatar.jpg')
            .execute 'return $("#notify:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                expect(isChecked.value).toBe(1)
            # current avatar should be in the header too
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('default-avatar.jpg')
            .call(done)

    it 'should save notification changes', (done) ->
        client
            .execute 'return $("#notify:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                expect(isChecked.value).toBe(1)
            .click('#notify:checked')
            .execute 'return $("#notify:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                expect(isChecked.value).toBe(0)
            .click('form button.action_button')
            .refresh()
            .pause 1000
            .execute 'return $("#notify:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                expect(isChecked.value).toBe(0)
            .call(done)

    it 'should save gravatar settings', (done) ->
        client
            # Turn on stuff
            # gravatar yes
            # notifications yes
            .click('#avatar_gravatar')
            .click('#notify')
            .click('form button.action_button')
            .waitFor(".action_button[disabled]", 5000)

            # check that new options are set
            # .waitFor('.settingSaveAlert', 7000)
            .isSelected('#avatar_gravatar')
            .isVisible('#notify:checked')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .refresh()

            # check again that page displays expected options
            .isSelected('#avatar_gravatar')
            .isVisible('#notify:checked')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            # check the header too
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .call(done)
