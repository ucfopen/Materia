setup = require('./_setup')

describe 'Homepage', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'should display correctly', (done) ->
        client
            .url('http://localhost:8080/')
            .getTitle( (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Welcome to Materia | Materia')
            )
            .waitFor('.store_main', 7000)
            .isVisible('.store_main:first-child section')
            .execute('return $(".store_main section").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBeGreaterThan(0)
            )
            .click('.span_next:last-child')
            .pause(1500)
            .isVisible('.store_main:last-child section')
            .pause(2000)
            .call(done)

