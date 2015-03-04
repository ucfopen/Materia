setup = require('./_setup')

describe 'Homepage', ->
    client = null

    beforeEach ->
        unless client
            client = setup.webdriver.remote(setup.webdriverOptions).init()

    it 'should display correctly', (done) ->
        client
            .url('http://localhost:8080/')
            .waitForVisible('.main_container', 7000)
            .getTitle (err, title) -> expect(title).toBe('Welcome to Materia | Materia')
            .waitForVisible('.main_container article:first-child', 7000)
            .execute 'return $(".main_container article").length;', null, (err, result) -> expect(result.value).toBeGreaterThan(0)
            .click('.span_next:last-child')
            .waitForVisible('.main_container article:last-child', 7000)
            .call(done)
            .end(done)

