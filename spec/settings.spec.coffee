setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach ->
        unless client
            client = setup.getClient()

    it ' settings should redirect to login', (done) ->
        client
            .url("#{setup.url}/settings")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .call(done)
            .end(done)

describe 'Settings page', ->
    client = null

    beforeEach ->
        unless client
            client = setup.getClient()
            setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client
            .url("#{setup.url}/settings")
            # make sure avitar is set to default
            .click('#avatar_default')
            # make sure notify is selected
            .isSelected "#notify", (err, isSelected) -> unless isSelected then client.click("#notify")
            .click('form button.action_button')
            .pause(500)

    it 'should display default options', (done) ->
        client
            # Check page state
            .getTitle (err, title) -> expect(title).toBe('Settings | Materia')
            .isVisible('.avatar_big')
            # save should be disabled
            .isEnabled "form button.action_button", (err, isEnabled) -> expect(isEnabled).toBe(false)
            .isSelected('#avatar_default')
            .isSelected('#notify')
            # current avatar should be in the header too
            .getAttribute '.avatar_big img', 'src', (err, src) -> expect(src).toContain('default-avatar.jpg')
            .call(done)

    it 'should save notification changes', (done) ->
        client
            .getTitle (err, title) -> expect(title).toBe('Settings | Materia')
            .isSelected('#notify')
            .click('#notify') # turn off
            .waitForEnabled('form button.action_button', 1500) # true reverses test
            .click('form button.action_button')
            .waitForEnabled('form button.action_button', 1500, true) # true reverses test
            .refresh()
            .getTitle (err, title) -> expect(title).toBe('Settings | Materia')
            .waitForChecked("#notify", 1500, true) # true reverses test
            .call(done)

    it 'should save gravatar settings', (done) ->
        client
            # Turn on stuff
            # gravatar yes
            # notifications yes
            .click('#avatar_gravatar')
            .click('#notify')
            .click('form button.action_button')
            .waitForEnabled('.action_button', 5000, true) # true reverses test
            .isSelected('#avatar_gravatar')
            .isSelected('#notify')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(src).toContain('&d=retro')
                expect(src).toContain('secure.gravatar.com/avatar')
                expect(src).toContain('100')
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .refresh()

            # check again that page displays expected options
            .isSelected('#avatar_gravatar')
            .isSelected('#notify')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            # check the header too
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .call(done)
            .end(done)
