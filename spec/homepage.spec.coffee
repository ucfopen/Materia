setup = require('./_setup')

describe 'Homepage', ->
    client = null

    beforeEach ->
        unless client
            client = setup.getClient()

    it 'should display correctly', (done) ->
        client
            .url("#{setup.url}/")
            .waitForPageVisible('.main_container', 7000)
            .getTitle (err, title) -> expect(title).toBe('Welcome to Materia | Materia')
            .waitForPageVisible('.main_container article:first-child', 7000)
            .execute 'return $(".main_container article").length;', null, (err, result) -> expect(result.value).toBeGreaterThan(0)
            .click('.span_next:last-child')
            .waitForPageVisible('.main_container article:last-child', 7000)
            .call(done)
            .end(done)

