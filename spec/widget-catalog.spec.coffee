setup = require('./_setup')

describe 'Widget Catalog Page', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'should display widgets', (done) ->
        client
            .url('http://localhost:8080/widgets')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Widget Catalog | Materia')

            # make sure the widgets get loaded
            .waitFor('.widget', 7000)
            .execute 'return $(".widget").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBeGreaterThan(0)
            .isVisible '.flash-cards', (err, result) ->
                expect(err).toBeNull()
                expect(result).toBe(true)
            .isVisible '.enigma', (err, result) ->
                expect(err).toBeNull()
                expect(result).toBe(true)
            .isVisible '.timeline', (err, result) ->
                expect(err).toBeNull()
                expect(result).toBe(true)
            .isVisible '.labeling', (err, result) ->
                expect(err).toBeNull()
                expect(result).toBe(true)
            # make sure the check boxes do stuff
            .click('#filter-scorable')
            .pause(500) # wait for a transition to animate
            .getElementCssProperty 'css selector', '.flash-cards.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .getElementCssProperty 'css selector', '.timeline.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .getElementCssProperty 'css selector', '.enigma.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(opacity).toBe('1')
            .click('#filter-qa')
            .pause(500)
            .getElementCssProperty 'css selector', '.enigma.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .getElementCssProperty 'css selector', '.timeline.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .click('#filter-media')
            .pause(500)
            .getElementCssProperty 'css selector', '.enigma.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .getElementCssProperty 'css selector', '.timeline.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.3, 2)
            .getElementCssProperty 'css selector', '.labeling.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(opacity).toBe('1')
            .click('#filter-scorable')
            .click('#filter-qa')
            .click('#filter-media')
            .pause(500)
            .getElementCssProperty 'css selector', '.enigma.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(1, 2)
            .getElementCssProperty 'css selector', '.timeline.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(1, 2)
            .getElementCssProperty 'css selector', '.flash-cards.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(1, 2)
            .getElementCssProperty 'css selector', '.labeling.widgetMin', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(1, 2)

            # Check mouse over info card functions
            .execute 'return $(".infocard:hover").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(0)
            .moveToObject('.labeling')
            .pause(1000)
            .execute 'return $(".infocard:hover").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(1)
            .call(done)
            .call -> client.end(done)


describe 'Widget Exists', ->
    client = null
    beforeEach -> client = setup.webdriverjs.remote(setup.webdriverOptions).init()
    afterEach (done) -> client.end(done)

    it 'widget should appear on catalog', (done) ->
        client
            .url('http://localhost:8080/widgets')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Widget Catalog | Materia')
            # make sure the widgets get loaded
            .waitFor('.widget', 4000)
            .execute 'return $(".widget").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBeGreaterThan(0)
                currentTitle = ''

                for i in [1...result.value]
                    client
                        .waitFor('.widget', 4000)
                        .moveToObject('.widget:nth-child('+i+')')
                        .getText '.widget:nth-child('+i+') .header h1', (err, title) ->
                            expect(err).toBeNull()
                            currentTitle = title
                        .click('.infocard .card-content')
                        .waitFor('.infocard:hover .header h1', 4000)
                        .pause 50
                        .getText '.infocard:hover .header h1', (err, widgetPageTitle) ->
                            expect(err).toBeNull()
                            expect(widgetPageTitle).toBe(currentTitle)
                        .back()
            .call(done)
    , 55000