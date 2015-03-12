setup = require('./_setup')

describe 'When I create a widget', ->
    instanceID = null
    copyInstanceID = null
    title = 'Selenium Test Enigma Widget '+Math.random()
    copyTitle = "#{title} COPY TEST"
    client = null

    beforeEach ->
        unless client
            client = setup.getClient()

    it 'it should update hash url', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client.url("#{setup.url}/widgets")
            .getTitle (err, title) -> expect(title).toBe('Widget Catalog | Materia')
            .waitFor('.widget.enigma', 3000)
            .moveToObject('.widget.enigma .infocard', 10, 10)
            .waitFor('.infocard:hover .header h1', 4000)
            .click('.infocard:hover .header')
            .waitForPageVisible('#createLink', 7000)
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
            .url("#{setup.url}/my-widgets#"+instanceID)
            .waitForPageVisible '#widget_'+instanceID, 7000
            .waitForPageVisible '.share-widget-container', 7000
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

    it 'it should copy and auto select', (done) ->
        client
            .url("about:blank")
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .getText '#widget_'+instanceID+'.gameSelected li.title', (err, selectedTitle) ->
                expect(selectedTitle).toBe(title)
            .waitFor '#copy_widget_link', 5000
            .pause 1000
            .getAttribute '#copy_widget_link', 'class', (err, classes) ->
                expect(classes).toContain('link')
                expect(classes).not.toContain('disabled')
            .click('#copy_widget_link')
            .isVisible('.ng-modal-title', 500)
            .getText '.copy .ng-modal-title', (err, text) ->
                expect(text).toContain('Make a Copy')
            .setValue('.newtitle', copyTitle)
            # .waitFor '.copy_button.action_button', 7000
            .click '.copy_button.action_button'

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
                selector = '#widget_'+copyInstanceID+'.gameSelected'
                client
                    .waitForVisible(selector, 7000)
                    .waitForText('.page h1', 7000)
                    .call(done)
                # copy shows up in list and selected
                # .getText '.page h1', (err, text) ->
                #     expect(text).toBe(copyTitle)
                # # copy shows up in main window
                # .getText '.widget.gameSelected li.title', (err, text) ->
                #     expect(text).toBe(copyTitle)
    , 45000

    it 'it should display the collaboration dialog with default settings', (done) ->
        client
            .url("about:blank")
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .waitFor '.share div.link', 7000
            .pause 1000
            .click '.share div.link'
            .waitFor '.share .ng-modal-title', 7000
            .isVisible '.share'
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
            .waitForPageVisible '#access .cancel_button', 7000
            .click '#access .cancel_button'
            .call done


    it 'it should allow you to add a collaborator', (done) ->
        client
            .url("about:blank")
            .url('http://localhost:8080/my-widgets#/'+copyInstanceID)
            .pause 5000
            .waitFor '#widget_'+copyInstanceID+'.gameSelected', 7000
            .waitFor '.share div.link', 7000
            .pause 1000
            .click '.share div.link'
            .waitFor '.share .ng-modal-title', 7000

            # now let's add a collaborator
            .setValue '.user_add', 'student'
            .waitFor '.search_match', 7000
            .click '.search_match'

            # make sure we now have student in the list with view scores access
            .execute "return $('.access_list .user_perm').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(2)
            .execute "return $('.access_list .user_perm:nth-child(2) .name').html();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toContain('John Student')
            .execute "return $('.access_list .user_perm:nth-child(2) select.perm').val();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe('0')
            .execute "return $('.access_list .exp-date').val();", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe('Never')

            # save our changes & make sure the collaboration count updates
            .click '.save_button'
            .pause 2000
            .getText '.share div.link', (err, text) -> expect(text).toBe 'Collaborate (1)'

            # make sure they still show up
            .pause 1000
            .click '.share div.link'
            .waitFor '.share .ng-modal-title', 7000
            .pause 1000
            .execute "return $('.access_list .user_perm').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(2)
            .call done

    it 'it should allow you to remove a collaborator', (done) ->
        client
            .url('about:blank')
            .url('http://localhost:8080/my-widgets#/'+copyInstanceID)
            .pause 5000
            .waitFor('#widget_'+copyInstanceID+'.gameSelected', 7000)
            .pause 1000
            .click('.share div.link')
            .waitFor '.share .ng-modal-title', 7000

            # remove them
            .waitFor '.user_perm[data-user-id="3"] .remove', 7000
            .click '.user_perm[data-user-id="3"] .remove'
            .pause 1000
            .click '.save_button'
            .pause 1000
            .getText '.share div.link', (err, text) -> expect(text).toBe 'Collaborate'

            # make sure the user we deleted is gone
            .pause 1000
            .click '.share div.link'
            .waitFor '.share .ng-modal-title', 7000
            .pause 1000
            .execute "return $('.access_list .user_perm:not(.ng-hide)').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(1)
            .call done

    it 'it should limit your abilities after downgrading your access', (done) ->
        client
            .url 'about:blank'
            .url('http://localhost:8080/my-widgets#/'+copyInstanceID)
            .pause 5000
            .waitFor('#widget_'+copyInstanceID+'.gameSelected', 7000)
            .pause 1000
            .click('.share div.link')
            .waitFor '.share .ng-modal-title', 7000

            # now let's try to lower our access
            .waitFor '.access_list .user_perm[data-user-id="2"] select', 7000
            .selectByValue '.access_list .user_perm[data-user-id="2"] select', '0'
            .waitFor '.access_list .user_perm[data-user-id="2"] .demote_dialogue', 7000
            .click '.access_list .user_perm:first-child .demote_dialogue .no_button'
            #@TODO - test completing this and make sure features don't work
            .call done

    it 'it remove a widget from my widgets after removing your access', (done) ->
        client
            .url 'about:blank'
            .url('http://localhost:8080/my-widgets#/'+copyInstanceID)
            .pause 5000
            .waitFor('#widget_'+copyInstanceID+'.gameSelected', 7000)
            .pause 1000
            .click('.share div.link')
            .waitFor '.share .ng-modal-title', 7000

            # now let's try to remove our access
            .waitForPageVisible '.access_list .user_perm[data-user-id="2"] .remove', 7000
            .click '.access_list .user_perm[data-user-id="2"] .remove'
            .waitForPageVisible '.access_list .user_perm[data-user-id="2"] .demote_dialogue', 7000
            .click '.access_list .user_perm[data-user-id="2"] .demote_dialogue .yes_button'
            .pause 1000
            .click '.save_button'
            .url 'about:blank'
            .url 'http://localhost:8080/my-widgets#/' + copyInstanceID
            .pause 5000
            .execute "return $('#widget_"+copyInstanceID+"').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(0)
            .call done


    it 'it should delete using the delete button', (done) ->
        client
            .url 'about:blank'
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause 5000
            .waitFor '#delete_widget_link', 7000
            .click '#delete_widget_link'
            .waitFor '.controls .delete_button', 7000
            .click '.delete_button'
            .waitForExist "#widget_#{instanceID}.gameSelected", 2000, true # reversed, wait for it not to exist
            .url('about:blank')
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause 3000
            .waitForExist '#widget_' + instanceID, 7000, true # reversed, wait for it not to exist
            .waitForVisible '.error-nowidget', 7000
            .call(done)
            .end(done)
    , 25000


