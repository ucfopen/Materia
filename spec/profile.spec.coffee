setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach ->
        unless client
            client = setup.getClient()

    it ' profile should redirect to login', (done) ->
        client
            .url("#{setup.url}/settings")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .call(done)


    it 'should display profile', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/profile"
        client
            .pause 100
            .waitForPageVisible '.container', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .url("#{setup.url}/profile")
            .waitForPageVisible '.user_type', 5000
            .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
            .getText '.page h2', (err, text) -> expect(text).toContain(setup.author.name)
            .isVisible('.avatar_big')
            .call(done)

    it 'should allow me to view the score screen of a previous attempt', (done) ->
        client
            .waitForPageVisible 'a.score-link', 5000
            .click 'a.score-link'
            .pause 2500
            .waitForPageVisible '.overview #overview-score', 8000
            .call(done)
            .end(done)
