setup = require('./_setup')

describe 'Widget Catalog Page', ->
    client = null
    beforeEach ->
        unless client
            client = setup.getClient()

    it 'should display widgets', (done) ->
        client
            .url("#{setup.url}/widgets")
            .waitFor '.widget', 7000
            .getTitle (err, title) -> expect(title).toBe('Widget Catalog | Materia')
            # make sure the widgets get loaded
            .execute 'return $(".widget").length;', null, (err, result) -> expect(result.value).toBeGreaterThan(0)
            .isVisible '.flash-cards'
            .isVisible '.enigma'
            .isVisible '.timeline'
            .isVisible '.labeling'
            # make sure the check boxes do stuff
            .isSelected "#filter-scorable", (err, isSelected) -> unless isSelected then client.click("#filter-scorable")
            .pause(500) # wait for a transition to animate
            .getCssProperty '.flash-cards.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.timeline.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.enigma.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBe(1)
            .isSelected "#filter-qa", (err, isSelected) -> unless isSelected then client.click("#filter-qa")
            .pause(500) # wait for a transition to animate
            .getCssProperty '.enigma.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.timeline.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .isSelected "#filter-media", (err, isSelected) -> unless isSelected then client.click("#filter-media")
            .pause(500) # wait for a transition to animate
            .getCssProperty '.enigma.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.timeline.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.labeling.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBe(1)
            .isSelected "#filter-scorable", (err, isSelected) -> unless isSelected then client.click("#filter-scorable")
            .isSelected "#filter-qa", (err, isSelected) -> unless isSelected then client.click("#filter-qa")
            .isSelected "#filter-media", (err, isSelected) -> unless isSelected then client.click("#filter-media")
            .pause(500) # wait for a transition to animate
            .getCssProperty '.enigma.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.timeline.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.flash-cards.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeCloseTo(0.3, 2)
            .getCssProperty '.labeling.widget-min', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBe(1)

            # Check mouse over info card functions
            .execute 'return $(".infocard:hover").length;', null, (err, result) -> expect(result.value).toBe(0)
            .call(done)

    it 'widget should appear on catalog', (done) ->
        client
            .url("#{setup.url}/widgets")
            .getTitle (err, title) -> expect(title).toBe('Widget Catalog | Materia')
            # make sure the widgets get loaded
            .waitFor('.widget', 4000)
            .execute 'return $(".widget").length;', null, (err, result) ->
                expect(result.value).toBeGreaterThan(0)
                currentTitle = ''

                for i in [1...result.value]
                    client
                        .waitFor('.widget', 4000)
                        .moveToObject ".widget:nth-child(#{i}) .infocard", 10, 10
                        .getText ".widget:nth-child(#{i}) .widget-min .widget-info h1", (err, title) ->
                            currentTitle = title
                            expect(currentTitle).toBeTruthy()
                        .waitFor('.infocard:hover .widget-info h1', 4000)
                        .getCssProperty '.infocard:hover', 'opacity', (err, opacity) ->
                            expect(opacity.property).toBe('opacity')
                            expect(opacity.value).toBeGreaterThan(0)
                        .getText '.infocard:hover .widget-info h1', (err, widgetPageTitle) ->
                            expect(widgetPageTitle).toBe(currentTitle)
            .call(done)
            .end(done)
    , 55000
