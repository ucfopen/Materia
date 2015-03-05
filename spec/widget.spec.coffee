setup = require('./_setup')

describe 'When I create a widget', ->
    instanceID = null
    copyInstanceID = null
    title = 'Selenium Test Enigma Widget '+Math.random()
    copyTitle = "#{title} COPY TEST"
    client = null

    beforeEach ->
        unless client
            client = setup.webdriver.remote(setup.webdriverOptions).init()

    it 'it should update hash url', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client.url("#{setup.url}/widgets")
            .getTitle (err, title) -> expect(title).toBe('Widget Catalog | Materia')
            .waitFor('.widget.enigma', 3000)
            .moveToObject('.widget.enigma .infocard', 10, 10)
            .waitFor('.infocard:hover .header h1', 4000)
            .click('.infocard:hover .header')
            .waitForVisible('#createLink', 7000)
            .click('#createLink')
        setup.testEnigma client, title, false
        client
            .execute "return document.location.hash.substring(1);", null, (err, result) ->
                instanceID = result.value
                # console.log "instanceid: #{instanceID}"
                expect(instanceID).not.toBeNull()
                expect(instanceID.length).toBe(5)
            .call(done)
    , 55000

    it 'it should appear as a draft', (done) ->
        client
            .call -> expect(instanceID.length).toBe(5)
            .url("#{setup.url}/my-widgets#"+instanceID)
            .waitFor "#widget_#{instanceID}", 7000
            .getTitle (err, title) -> expect(title).toBe('My Widgets | Materia')
            .getText '#widget_'+instanceID+' .score', (err, mode) -> expect(mode).toBe('Draft')
            .call(done)
    , 22000

    it 'it should appear on my widgets page', (done) ->
        client
            .call ->
                expect(instanceID).not.toBeNull()
                expect(instanceID.length).toBe(5)
            .url("#{setup.url}/my-widgets#"'+instanceID)
            .waitForVisible '#widget_'+instanceID, 7000
            .waitForVisible '.share-widget-container', 7000
            .getCssProperty '.share-widget-container', 'opacity', (err, opacity) ->
                expect(opacity.property).toBe('opacity')
                expect(opacity.value).toBeGreaterThan(0)
                expect(opacity.value).toBeCloseTo(0.5, 2)
            .getCssProperty '#embed_link', 'display', (err, display) ->
                expect(display.property).toBe('display')
                expect(display.value).toBe('none')
            .waitForEnabled '#play_link', 5000, true # wait for it to be disabled
            .getText '#widget_'+instanceID+' .score', (err, mode) ->
                expect(mode).toBe('Draft')
            .getText '.container .page h1', (err, mode) ->
                expect(mode).toBe(title)
            .call(done)

    it 'it should be selected on my widgets page', (done) ->
        client
            .call -> expect(instanceID.length).toBe(5)
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .call(done)


    it 'it should collaborate', (done) ->
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .waitForVisible '.share div.link'
            .pause(1000)
            .click('.share div.link')
            .waitFor('.share .ng-modal-title', 7000)
            .isVisible('.share')
            .getText '.share .ng-modal-title', (err, text) ->
                expect(text).toContain('Collaboration')
            .waitFor('.access_list .user_perm', 7000)
            .execute "return $('.access_list .user_perm').length;", null, (err, result) ->
                expect(result.value).toBe(1)
            .execute "return $('.access_list .user_perm:first-child .name').html();", null, (err, result) ->
                expect(result.value).toContain('Prof Author')
            .execute "return $('.access_list .user_perm:first-child select.perm').val();", null, (err, result) ->
                expect(result.value).toBe('30')
            .execute "return $('.access_list .exp-date').val();", null, (err, result) ->
                expect(result.value).toBe('Never')
            .waitForVisible '#access .cancel_button', 500
            .click('#access .cancel_button')
            .call(done)

    it 'it should copy and auto select', (done) ->
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .getText '#widget_'+instanceID+'.gameSelected li.title', (err, selectedTitle) ->
                expect(selectedTitle).toBe(title)
            .waitForVisible '#copy_widget_link', 5000
            .pause 1000
            .getAttribute '#copy_widget_link', 'class', (err, classes) ->
                expect(classes).toContain('link')
                expect(classes).not.toContain('disabled')
            .click('#copy_widget_link')
            .isVisible('.ng-modal-title', 500)
            .getText '.copy .ng-modal-title', (err, text) ->
                expect(text).toContain('Make a Copy')
            .setValue('.newtitle', copyTitle)
            .click('.copy_button.action_button')

            # complicated bit, inject an interval timer into the
            # page to determine when the hash url changes and return
            # the new hash url
            .timeoutsAsyncScript 5000
            .executeAsync (instanceID, done) ->
                # this happens in the browser
                setInterval ->
                    if document.location.hash.indexOf(instanceID) == -1
                        done(document.location.hash.substring(2))
                , 500
            , instanceID, (err, result) ->
                # this happens here
                copyInstanceID = result.value
                expect(copyInstanceID.length).toBe(5)
                # console.log "Copy Instance: #{result.value}"
            .waitForVisible('#widget_'+copyInstanceID+'.gameSelected', 7000)
            .waitForText('.page h1', 7000)
            # copy shows up in list and selected
            .getText '.page h1', (err, text) ->
                expect(text).toBe(copyTitle)
            # copy shows up in main window
            .getText '.widget.gameSelected li.title', (err, text) ->
                expect(text).toBe(copyTitle)
            .call(done)
    , 45000

    it 'it should delete using the delete button', (done) ->
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause 3000
            .waitForVisible '#delete_widget_link', 5000
            .click '#delete_widget_link'
            .waitForVisible '.controls .delete_button', 5000
            .click '.delete_button'
            .waitForExist "#widget_#{instanceID}.gameSelected", 2000, true # reversed, wait for it not to exist
            .refresh()
            .pause 3000
            .execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
                expect(result.value).toBe(0)
            .pause 1800
            .isVisible '.error-nowidget'
            .call(done)
            .end(done)
    , 25000


