setup = require('./_setup')

describe 'When I create a widget', ->
    instanceID = null
    publishedInstanceID = null
    publishedTitle = "Selenium Published Widget"
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
                if instanceID.substring(0,1) == "/"
                    instanceID = instanceID.substring(1)
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

    it 'should be able to make and play a published widget', (done) ->
        client.url("#{setup.url}/widgets")
            .getTitle (err, title) -> expect(title).toBe('Widget Catalog | Materia')
            .waitFor('.widget.enigma', 3000)
            .moveToObject('.widget.enigma .infocard', 10, 10)
            .waitFor('.infocard:hover .header h1', 4000)
            .click('.infocard:hover .header')
            .waitForPageVisible('#createLink', 7000)
            .click('#createLink')
        setup.testEnigma client, title, true
        client
            .execute "return document.location.hash.substring(1);", null, (err, result) ->
                publishedInstanceID = result.value
                if publishedInstanceID.substring(0,1) == "/"
                    publishedInstanceID = publishedInstanceID.substring(1)

                expect(publishedInstanceID).not.toBeNull()
                expect(publishedInstanceID.length).toBe(5)

                playcode = "return Materia.Engine.end();"

                client
                    .pause 2000
                    .url("#{setup.url}/play/"+publishedInstanceID)
                    .pause 1000
                    .waitForPageVisible '#container', 10000
                    .frame('container')
                    .pause 1000
                    .execute playcode, null, (err, result) ->
                        expect(result).not.toBeNull()
                        client
                            .pause 2000
                            .call done
                            .end done

    it 'should show the settings dialog with default values', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client
            .url "about:blank"
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitFor '#widget_' + publishedInstanceID + '.gameSelected', 7000
            .waitFor '#edit-availability-button'
            .click '#edit-availability-button'
            .waitFor '.availability .ng-modal-title', 7000
            .call done
    , 55000

    it 'should show student activity', (done) ->
        # play the game to get a score
        client
            .url "#{setup.url}/play/#{publishedInstanceID}"
        setup.playEnigma client

            # look for student activity
            .url 'about:blank'
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitFor '.scoreWrapper', 7001
            .getText '.players', (err, text) -> expect(text).toBe('1')
            .getText '.score-count', (err, text) -> expect(text).toBe('2')
            .getText '.final-average', (err, text) -> expect(text).toBe('50')
            .pause 100

        # play the game again
        client
            .url "about:blank"
            .url "#{setup.url}/play/#{publishedInstanceID}"
        setup.playEnigma client
            # look for updated student activity
            .url 'about:blank'
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitFor '.scoreWrapper', 7002
            .getText '.players', (err, text) -> expect(text).toBe('1')
            .getText '.score-count', (err, text) -> expect(text).toBe('3')
            .getText '.final-average', (err, text) -> expect(text).toBe('67')
            .pause 100
            .call done
    , 55000

    it 'should display the individual scores tab when selected', (done) ->
        client
            .url "about:blank"
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitForPageVisible 'a.table', 7000
            .click 'a.table'
            .waitForPageVisible '.score-search > input', 7000
            .call done
    , 55000

    it 'should filter the individual scores list when searching for users', (done) ->
        client
            .url "about:blank"
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitForPageVisible 'a.table', 7000
            .click 'a.table'
            .waitForPageVisible '.score-search > input', 7000

            # search for "author", should have 1 result
            .setValue '.score-search > input', "author"
            .pause 1000
            .waitForPageVisible 'td.listName', 7000
            .getText 'td.listName', (err, text) -> expect(text).toBe('Author, Prof')

            # search for "xyzzy", nothing should be found
            .setValue '.score-search > input', "xyzzy"
            .pause 1000
            .waitForExist 'td.listName', 7000, true # reverse, so, waitForNotExist

            .call done
    , 55000

    it 'should take me to the score screen when clicking on an individual score', (done) ->
        client
            .url "about:blank"
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitForPageVisible 'a.table', 7000
            .click 'a.table'
            .waitForPageVisible '.scoreListTable td', 7000
            .click '.scoreListTable td'
            .waitForPageVisible '.scoreTable tr', 7000
            .click '.scoreTable tr'
            .call done
    , 55000

    it 'it should show the export scores dialog title', (done) ->
        client
            .frame null
            .pause 3000
            .url("#{setup.url}/my-widgets#/"+publishedInstanceID)
            .pause 7000
            .waitForPageVisible '#export_scores_button', 5000
            .click '#export_scores_button'
            .pause 100
            .waitForPageVisible 'a.show_options', 5000
            .pause 100
            .click 'a.show_options'
            .pause 100
            .waitForPageVisible '.export_which', 5000
            .call(done)
            .end done
    , 55000

    it 'it should collaborate', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause(2000)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .waitForPageVisible '.share div.link'
            .pause(2000)
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
            .waitForPageVisible '#access .cancel_button', 500
            .click('#access .cancel_button')
            .call(done)

    it 'it should copy and auto select', (done) ->
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .getText '#widget_'+instanceID+'.gameSelected li.title', (err, selectedTitle) ->
                expect(selectedTitle).toBe(title)
            .waitForPageVisible '#copy_widget_link', 5000
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
    it 'should not display the export scores dialog for a widget without scores', (done) ->
        client
            .url "about:blank"
            .url "#{setup.url}/my-widgets#/" + instanceID
            .pause 5000
            .waitForPageVisible '#export_scores_button'
            .click '#export_scores_button'
            .waitForPageVisible '.csv_popup .download_wrapper h3', 7000, true
            .call done
    , 55000

    it 'should save widget settings', (done) ->
        client
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitFor '#widget_' + publishedInstanceID + '.gameSelected', 7000
            .waitFor '#edit-availability-button'

            # Set this widget to 1 attempt, open 1/1/1970 at 9AM, close at 1/1/2038 at 11AM
            .click '#edit-availability-button'
            .waitFor '.availability .ng-modal-title', 7000
            .click '#value_1'
            .pause 100
            .click '.from .date'
            .pause 100
            .setValue '.from .date', "01/01/1970"
            .pause 100
            .setValue '.from .time', "9:00"
            .click '.to .date'
            .pause 100
            .setValue '.to .date', "01/01/2038"
            .pause 100
            .setValue '.to .time', "11:00"
            .pause 100
            .click '.availability .action_button.save'
            .pause 5000
            .waitForPageVisible '.num-attempts', 7000
            .getText '.num-attempts', (err, text) -> expect(text).toBe('1')
            .getText '.availability-time', (err, text) -> expect(text).toBe("From 1/1/70 at 9:00am until 1/1/38 at 11:00am")

            # Now lets set it back to default
            .click '#edit-availability-button'
            .waitFor '.availability .ng-modal-title', 7000
            .click '#value_25'
            .pause 100
            .click '.from .anytime.availability'
            .pause 100
            .click '.to .anytime.availability'
            .pause 1000
            .click '.availability .action_button.save'
            .pause 5000
            .waitForPageVisible '.num-attempts', 7000
            .getText '.num-attempts', (err, text) -> expect(text).toBe('Unlimited')
            .getText '.availability-time', (err, text) -> expect(text).toBe("Anytime")
            .call done
    , 55000

    it 'should reject saving invalid widget settings and display expected errors', (done) ->
        client
            .url "#{setup.url}/my-widgets#/" + publishedInstanceID
            .pause 5000
            .waitFor '#widget_' + publishedInstanceID + '.gameSelected', 7000
            .waitFor '#edit-availability-button'

            # Attempt to set this widget to open at 1/1/1970 but no close time
            .click '#edit-availability-button'
            .waitFor '.availability .ng-modal-title', 7000
            .click '.from .date'
            .setValue '.from .date', "01/01/1970"
            .click '.availability .action_button.save'
            .waitForPageVisible '.availabilityError', 7000
            .getText '.availabilityError', (err, text) -> expect(text).toBe('The time is missing.')
            .waitFor '.availability .ng-modal-title', 7000

            # @TODO: Check for all possible error states

            .call done

    it 'it should display the collaboration dialog with default settings', (done) ->
        client
            .url("about:blank")
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause 5000
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .waitForPageVisible '.share div.link', 7000
            .pause 1000
            .click '.share div.link'
            .waitForPageVisible '.share .ng-modal-title', 7000
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
            .waitForPageVisible '.share div.link', 7000
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
            .click '.access_list .user_perm:first-child .demote_dialogue .yes_button'
            .pause 1000
            .click '.save_button'
            .url 'about:blank'
            .url('http://localhost:8080/my-widgets#/'+copyInstanceID)
            .pause 5000

            # editing should fail
            .click '#edit_button'
            .waitForPageVisible '.edit-published-widget .ng-modal-title', 7000, true #reversed, so, waitForNotPageVisible

            # copying should fail
            .click '#copy_widget_link'
            .waitForPageVisible '.copy .ng-modal-title', 7000, true #reversed, so, waitForNotPageVisible

            # delete should fail
            .click '#delete_widget_link'
            .waitForPageVisible '.controls .delete_button', 7000, true #reversed, so, waitForNotPageVisible

            # edit settings should fail
            .click '#edit-availability-button'
            .waitForPageVisible '.availability .ng-modal-title', 7000, true  #reversed, so, waitForNotPageVisible

            # upgrading access should fail
            .click '.share div.link'
            .waitFor '.share .ng-modal-title', 7000
            .waitFor '.access_list .user_perm[data-user-id="2"] select:disabled', 7000
            .getValue '.access_list .user_perm[data-user-id="2"] select', (err, val) -> expect(val).toBe('0')
            .pause 1000

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
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .pause 3000
            .waitForPageVisible '#delete_widget_link', 5000
            .click '#delete_widget_link'
            .waitForPageVisible '.controls .delete_button', 5000
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

