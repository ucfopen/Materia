setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    title = 'Selenium Test Enigma Widget '+Math.random()
    beforeEach ->
        unless client
            client = setup.getClient()

    # it ' profile should redirect to login', (done) ->
    #     client
    #         .url("#{setup.url}/settings")
    #         .getTitle (err, title) -> expect(title).toBe('Login | Materia')
    #         .call(done)


    # it 'should display profile', (done) ->
    #     setup.loginAt client, setup.author, "#{setup.url}/profile"
    #     client
    #         .pause 100
    #         .waitForPageVisible '.container', 5000
    #         .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
    #         .url("#{setup.url}/profile")
    #         .waitForPageVisible '.user_type', 5000
    #         .getTitle (err, title) -> expect(title).toBe('Profile | Materia')
    #         .getText '.page h2', (err, text) -> expect(text).toContain(setup.author.name)
    #         .isVisible('.avatar_big')
    #         .call(done)

    it 'should allow me to view the score screen of a previous attempt', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client.url "#{setup.url}/widgets/#{setup.enigma}/create"
        setup.testEnigma client, title, true

        client
            .execute "return document.location.hash.substring(1);", null, (err, result) ->
                publishedInstanceID = result.value
                if publishedInstanceID.substring(0,1) == "/"
                    publishedInstanceID = publishedInstanceID.substring(1)

                playcode = "return Materia.Engine.end();"

                client
                    .pause 5000
                    .url("#{setup.url}/play/"+publishedInstanceID)
                    .pause 1000

                    setup.playEnigma client
                    client
                        .url "#{setup.url}/profile"
                        .pause 1000
                        .waitForPageVisible '.score-link', 5000
                        .click '.score-link'
                        .pause 2500
                        .waitForPageVisible '.overview #overview-score', 8000
                        .call(done)
                        .end(done)