setup = require('./_setup')

describe 'When not logged in', ->
    client = null
    beforeEach ->
        unless client
            client = setup.getClient()

    it ' my-widgets should redirect to login', (done) ->
        client
            .url("#{setup.url}/settings")
            .getTitle (err, title) -> expect(title).toBe('Login | Materia')
            .call(done)

    it 'should relocate to my widgets on author login', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/login"
        client
            .waitForPageVisible '.my-widgets', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .call(done)

    it 'should display instructions by default', (done) ->
        client
            .waitForPageVisible '.my-widgets', 5000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .waitForPageVisible '.directions', 5000
            .getAttribute '.directions', 'class', (err, classes) ->
                if classes.indexOf('unchosen') != -1
                    client.getText '.directions.unchosen p', (err, text) -> expect(text).toBe('Choose a widget from the list on the left.')
                if classes.indexOf('no-widgets') != -1
                    client.getText '.directions.no-widgets p', (err, text) -> expect(text).toBe('Make a new widget in the widget catalog.')
            .call(done)
            .end(done)
