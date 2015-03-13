setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    instanceID = null
    title = 'Selenium Test Enigma Widget '+Math.random()
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
            .waitForPageVisible '.container', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .url("#{setup.url}/profile")
            .waitForPageVisible '.user_type', 5000
            .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
            .getText '.page h2', (err, text) -> expect(text).toContain(setup.author.name)
            .isVisible('.avatar_big')
            .call(done)

    it 'should show my scores in my profile activity', (done) ->
        client
            .url "#{setup.url}/widgets"
            .waitFor '.widget.enigma', 3000
            .moveToObject '.widget.enigma .infocard', 10, 10
            .waitFor '.infocard:hover .header h1', 4000
            .click '.infocard:hover .header'
            .waitForPageVisible '#createLink', 7000
            .click '#createLink'
        setup.testEnigma client, title, true
            .execute "return document.location.hash.substring(1);", null, (err, result) ->
                instanceID = result.value

                client
                    .url "about:blank"
                    .url "#{setup.url}/play/#{instanceID}"
                setup.playEnigma client
                    .url "about:blank"
                    .url "#{setup.url}/profile"
                    .waitForExist ".activity_log", 7000
                    .getText '.activity_log:first-child .title', (err, text) -> expect(text).toBe(title)
                    .getText '.activity_log:first-child .score', (err, text) -> expect(text).toBe('100')

                    .call done

    it 'should show me the score screen of a previous attempt', (done) ->
        client
            .url "about:blank"
            .url "#{setup.url}/profile"
            .waitForExist ".activity_log", 7000
            .click '.activity_log a'
            .waitForUrlContains '/scores/', 7000, (err, res, client) ->
                expect(err).toBe(null)
                client
                    .call done
                    .end done
