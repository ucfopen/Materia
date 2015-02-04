setup = require('./_setup')

describe 'When I create a widget', ->
    client = null
    beforeEach ->
        client = setup.webdriverjs.remote(setup.webdriverOptions).init()
        # Reset the profile every time
        client
            .url('http://localhost:8080/users/login')
            .setValue('#username', setup.author.username)
            .setValue('#password', setup.author.password)
            .click('form button.action_button')
            .pause(500)
    afterEach (done) -> client.end(done)

    instanceID = null
    title = 'Selenium Test Enigma Widget '+Math.random()
    copyTitle = "#{title} COPY TEST"

    it 'it should update hash url', (done) ->
        client.url('http://localhost:8080/widgets')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Widget Catalog | Materia')
            .waitFor('.widget.enigma', 7000)
            .moveToObject('.widget.enigma')
            .click('.infocard:hover .header')
            .waitFor('#createLink', 7000)
            .click('#createLink')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Create Widget | Materia')
            .waitFor('#container', 7000)
            .frame('container') # switch into widget frame
            .waitFor('.intro.show', 7000)
            .setValue('.intro.show input', title)
            .click('.intro.show input[type=button]')
            .setValue('#category_0', 'Test')
            .click('button.add')
            .setValue('#question_text', 'Test question')
            .frame(null) # switch back to main content
            .click('#creatorSaveBtn')
            .waitFor('#creatorSaveBtn.saved', 7000)
            .execute "return document.location.href.split('#')[1];", null, (err, result) ->
                instanceID = result.value
                expect(err).toBeNull()
                expect(instanceID.length).toBe(5)
            .call(done)
    , 55000

    it 'it should appear as a draft', (done) ->
        client
            .call -> expect(instanceID.length).toBe(5)
            .url('http://localhost:8080/my-widgets#'+instanceID)
            .pause(1000)
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .waitFor('#widget_'+instanceID, 7000)
            .getText '#widget_'+instanceID+' .score', (err, mode) ->
                expect(err).toBeNull()
                expect(mode).toBe('Draft')
            .call(done)
    , 22000

    it 'it should appear on my widgets page', (done) ->
        client
            .call -> expect(instanceID.length).toBe(5)
            .url('http://localhost:8080/my-widgets#/'+instanceID)
            .waitFor('#widget_'+instanceID, 7000)
            .pause(1000)
            .getElementCssProperty 'css selector', '.share-widget-container', 'opacity', (err, opacity) ->
                expect(err).toBeNull()
                expect(parseFloat(opacity)).toBeCloseTo(0.5, 2)
            .getElementCssProperty 'id', 'embed_link', 'display', (err, display) ->
                expect(err).toBeNull()
                expect(display).toBe('none')
            .getAttribute '#play_link', 'disabled', 'opacity', (err, disabled) ->
                expect(err).toBeNull()
                expect(disabled).toBe('disabled')
            .getText '#widget_'+instanceID+' .score', (err, mode) ->
                expect(err).toBeNull()
                expect(mode).toBe('Draft')
            .getText '.container .page h1', (err, mode) ->
                expect(err).toBeNull()
                expect(mode).toBe(title)
            .call(done)

    it 'it should be selected on my widgets page', (done) ->
        client
            .call -> expect(instanceID.length).toBe(5)
            .url('http://localhost:8080/my-widgets#/'+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .call(done)


    it 'it should collaborate', (done) ->
        client
            .url('http://localhost:8080/my-widgets#/'+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .pause(2000)
            .click('.share div.link')
            .waitFor('.share .ng-modal-title', 7000)
            .isVisible('.share')
            .getText '.share .ng-modal-title', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Collaboration:')
            .waitFor('.access_list .user_perm', 7000)
            .execute "return $('.access_list .user_perm').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(1)
            .execute "return $('.access_list .user_perm:first-child .name').html();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toContain('Prof Author')
            .execute "return $('.access_list .user_perm:first-child select.perm').val();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe('30')
            .execute "return $('.access_list .exp-date').val();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe('Never')
            .click('.cancel_button')
            .call(done)

    it 'it should copy', (done) ->
        client
            .url('http://localhost:8080/my-widgets#/'+instanceID)
            .pause 1900
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .getText '#widget_'+instanceID+'.gameSelected li.title', (err, selectedTitle) ->
                expect(err).toBeNull()
                expect(selectedTitle).toBe(title)
            .waitFor('#copy_widget_link:not([disabled])', 5000)
            .click('#copy_widget_link')
            .isVisible('.ng-modal-title')
            .getText '.copy .ng-modal-title', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Make a Copy:')
            .setValue('.newtitle', copyTitle)
            .click('.copy_button.action_button')
            # copy shows up in list and selected
            .pause(2000)
            .getText '.page h1', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe(copyTitle)
            # copy shows up in main window
            .getText '.widget.gameSelected li.title', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe(copyTitle)
            .call(done)
    , 45000

    it 'it should delete using the delete button', (done) ->
        client
            .url('http://localhost:8080/my-widgets#/'+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 5000)
            .pause(2000)
            .click('.controls #delete_widget_link')
            .waitFor('.controls .delete_dialogue', 5000)
            .isVisible('.delete_dialogue')
            .click('.delete_button')
            .pause(2000)
            .execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(0)
            .refresh()
            .waitFor('.widget', 5000)
            .pause(2000)
            .execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(0)
            .pause(1800)
            .isVisible('.error-nowidget')
            .call(done)
    , 25000
