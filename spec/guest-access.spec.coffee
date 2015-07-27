setup = require('./_setup')

describe 'Guest Access Feature', ->
    instanceID = null
    title = 'Guest Access Widget'
    client = null
    beforeEach ->
        unless client
            client = setup.getClient()

    it 'should let an instructor create a guest access widget', (done) ->
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client.url("#{setup.url}/widgets")
            .waitFor('.widget.enigma', 3000)
            .moveToObject('.widget.enigma .infocard', 10, 10)
            .waitFor('.infocard:hover .header h1', 4000)
            .click('.infocard:hover .header')
            .waitForPageVisible('#createLink', 7000)
            .click('#createLink')
        setup.testEnigma client, title, true
        client
            .execute "return document.location.hash.substring(1);", null, (err, result) ->
                instanceID = result.value
                if instanceID.substring(0,1) == "/"
                    instanceID = instanceID.substring(1)

                expect(instanceID).not.toBeNull()
                expect(instanceID.length).toBe(5)
                client
                    .url("#{setup.url}/my-widgets#/"+instanceID)
                    .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
                    .waitForPageVisible '.controls .access-level'
                    .pause(1000)
                    .waitFor('.controls .access-level span', 7000)
                    .getText '.controls .access-level span', (err, text) ->
                        expect(text).toContain('Staff and Students only')
                    .click('#edit-availability-button')
                    .waitFor('.availability .ng-modal-title', 7000)
                    .isVisible('.availability')
                    .getText '.availability .ng-modal-title', (err, text) ->
                        expect(text).toContain('Settings')
                    .waitFor('.availability #guest-access h3', 7000)
                    .getText '.availability #guest-access h3', (err, text) ->
                        expect(text).toContain('Access')
                    .waitFor('.availability #guest-access label', 7000)
                    .getText '.availability #guest-access label', (err, text) ->
                        expect(text).toContain('Enable Guest Mode')
                    .waitFor('.guest-checkbox', 7000)
                    .isSelected '.guest-checkbox', (err, isSelected) -> unless isSelected then client.click('.guest-checkbox')
                    .click('.availability .action_button.save')
                    .waitFor('.controls .access-level span', 7000)
                    .getText '.controls .access-level span', (err, text) ->
                        expect(text).toContain('Anonymous - No Login Required')
                    .end(done)
    , 55000

    it 'should let a guest play a guest widget', (done) ->
        client = setup.getClient()
        client.url("#{setup.url}/play/#{instanceID}")
            .waitFor('.center', 3003)
            .waitFor('.center iframe', 7000)
            .frame('container')
            .waitFor('.question.unanswered', 7000)
            .click('.question.unanswered')
            .waitFor('.answers label', 7000)
            .click('.answers label')
            .waitFor('.menu .submit', 7000)
            .click('.menu .submit')
            .click('.menu .return')
            .waitFor('.notice button', 7000)
            .click('.notice button')
            .frame(null)
            .pause(1000)
            .waitForPageVisible('.container', 7000)
            .waitFor('#overview-score h1', 7000)
            .getText '#overview-score h1', (err, text) ->
                expect(text).toContain('THIS ATTEMPT SCORE:')
            .call(done)
    , 55000

    it 'should not let a guest preview a guest widget', (done) ->
        client.url("#{setup.url}/preview/#{instanceID}")
            .waitFor('section.page')
            .waitFor('.detail .logo')
            .getText '.detail .logo', (err, text) ->
                expect(text).toContain('Login to preview this widget')
            .end(done)
    , 55000

    it 'should let a student play a guest widget', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.student, "#{setup.url}/users/login"
        client.url("#{setup.url}/play/#{instanceID}")
            .waitFor('.center', 3001)
            .waitFor('.center iframe', 7000)
            .frame('container')
            .waitFor('.question.unanswered', 7000)
            .click('.question.unanswered')
            .waitFor('.answers label', 7000)
            .click('.answers label')
            .waitFor('.menu .submit', 7000)
            .click('.menu .submit')
            .click('.menu .return')
            .waitFor('.notice button', 7000)
            .click('.notice button')
            .frame(null)
            .pause(1000)
            .waitForPageVisible('.container', 7000)
            .waitFor('#overview-score h1', 7000)
            .getText '#overview-score h1', (err, text) ->
                expect(text).toContain('THIS ATTEMPT SCORE:')
            .call(done)
    , 55000

    it 'should not let a student preview a guest widget', (done) ->
        client.url("#{setup.url}/preview/#{instanceID}")
            .waitFor('section.no_permission')
            .waitFor('.no_permission h1')
            .getText '.no_permission h1', (err, text) ->
                expect(text).toContain('You don\'t have permission to view this page.')
            .end(done)
    , 55000

    it 'should show guests in the student activity individual scores table', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client
            .waitFor('aside .courses .widget', 7000)
            .click('aside .courses .widget')
            .waitFor('.scores .choices .table', 7000)
            .click('.scores .choices .table')
            .waitFor('.scores table .listName', 7000)
            .getText '.scores table .listName', (err, text) ->
                expect(text).toContain('Guests')
            .getText '.scores .numeric .players', (err, text) ->
                expect(text).toContain('1')
            .getText '.scores .numeric .score-count', (err, text) ->
                expect(text).toContain('2')
            .call(done)
    , 55000

    it 'should not let a guest play a non-guest widget', (done) ->
        client
            .url("#{setup.url}/my-widgets#/"+instanceID)
            .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
            .waitForPageVisible '.controls .access-level'
            .pause(1000)
            .waitFor('.controls .access-level span', 7000)
            .getText '.controls .access-level span', (err, text) ->
                expect(text).toContain('Anonymous - No Login Required')
            .click('#edit-availability-button')
            .waitFor('.availability .ng-modal-title', 7000)
            .isVisible('.availability')
            .waitFor('.guest-checkbox', 7000)
            .isSelected '.guest-checkbox', (err, isSelected) -> if isSelected then client.click('.guest-checkbox')
            .click('.availability .action_button.save')
            .waitFor('.controls .access-level span', 7000)
            .getText '.controls .access-level span', (err, text) ->
                expect(text).toContain('Staff and Students only')
            .end ->
                client = setup.getClient()
                client.url("#{setup.url}/play/#{instanceID}")
                    .waitFor('section.page')
                    .waitFor('.detail .logo')
                    .getText '.detail .logo', (err, text) ->
                        expect(text).toContain('Login to play this widget')
                    .end(done)
    , 55000

    it 'should let a student play a non-guest widget', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.student, "#{setup.url}/users/login"
        client.url("#{setup.url}/play/#{instanceID}")
            .waitFor('.center', 3002)
            .waitFor('.center iframe', 7000)
            .frame('container')
            .waitFor('.question.unanswered', 7000)
            .click('.question.unanswered')
            .waitFor('.answers label', 7000)
            .click('.answers label')
            .waitFor('.menu .submit', 7000)
            .click('.menu .submit')
            .click('.menu .return')
            .waitFor('.notice button', 7000)
            .click('.notice button')
            .frame(null)
            .pause(1000)
            .waitForPageVisible('.container', 7000)
            .waitFor('#overview-score h1', 7000)
            .getText '#overview-score h1', (err, text) ->
                expect(text).toContain('ATTEMPT 1 SCORE:')
            .end(done)
    , 55000

    it 'should show students in the scores when not on guest mode', (done) ->
        client = setup.getClient()
        setup.loginAt client, setup.author, "#{setup.url}/users/login"
        client
            .waitFor('aside .courses .widget', 7000)
            .click('aside .courses .widget')
            .waitFor('.scores .choices .table', 7000)
            .click('.scores .choices .table')
            .waitFor('.scores table .listName', 7000)
            .getText '.scores table .listName', (err, text) ->
                expect(text).toContain('Guests')
            .getText '.scores .numeric .players', (err, text) ->
                expect(text).toContain('2')
            .getText '.scores .numeric .score-count', (err, text) ->
                expect(text).toContain('3')
            .end(done)
    , 55000

