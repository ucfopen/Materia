setup = require('./_setup')

describe 'LTI iframe test', ->
    client = null

    beforeEach ->
        client = setup.webdriverjs.remote(setup.webdriverOptions).init()
        client
            .url('http://localhost:8080/lti/test/provider')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Materia Test as Provider')

    afterEach (done) -> client.end(done)

    it 'should allow logging in as Instructor', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .waitFor 'header h1', 5000
            .getText 'header h1', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Select a Widget for use in Materia:')
            .call done

    it 'should allow logging in as New Instructor', (done) ->
        client
            .click('input[value="As NEW Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .waitFor '#no-widgets', 5000
            .call done

    it 'should show no widget warning', (done) ->
        client
            .click('input[value="As NEW Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .waitFor '#no-widgets', 5000
            .pause 1000
            .getText '#no-widgets', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe("You don't have any widgets yet. Click this button to create a widget, then return to this tab/window and select your new widget.\nCreate a widget at Materia")
            .call done

    it 'should allow refreshing after making new widget', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .waitFor '#no-widgets', 5000
            .url 'http://localhost:8080/widgets/3-enigma/create'
        testEnigma client
        client
            .url('http://localhost:8080/lti/test/provider')
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            #.waitFor '*:contains("Success!")', 10000
            .pause 5000
            .getText 'body', (err, text) ->
                expect(err).toBeNull()
                expect(text).toContain("basic_lti")
            .call done
    , 60000

    it 'should be playable by students', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 3000
            .frame(null)
            .click('input[value="As Learner"]')
            .pause(3000)
            .frame('embed_iframe') # switch into lti frame
            .getAttribute '#container', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('player.html')
            .call done
    , 60000

    it 'should be playable by new students', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 3000
            .frame(null)
            .click('input[value="As NEW Learner"]')
            .pause(3000)
            .frame('embed_iframe') # switch into lti frame
            .getAttribute '#container', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('player.html')
            .call done
    , 60000

    it 'should be playable by test student', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 6000
            .frame(null)
            .click('input[value="As Test Student"]')
            .pause(2000)
            .frame('embed_iframe') # switch into lti frame
            .waitFor '.screen.board', 5000
            .getAttribute '#container', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('player.html')
            .call done
    , 60000

    it 'should be show success to instructors', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 6000
            .frame(null)
            .click('#play_as_instructor')
            .pause(2000)
            .frame('embed_iframe') # switch into lti frame
            .pause(2000)
            .getText 'header h1', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe("Success")
            .call done
    , 60000

    it 'should pass oauth validation', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 6000
            .frame(null)
            .click('input[value="Test Validation"]')
            .pause(2000)
            .frame('embed_iframe') # switch into lti frame
            .waitFor '.screen.board', 5000
            .getText 'body', (err, body) ->
                expect(err).toBeNull()
                expect(body).toContain("PASSED!")
            .call done
    , 60000

    it 'should warn unkown assignments', (done) ->
        client
            .click('input[value="As Instructor"]')
            .frame('embed_iframe') # switch into lti frame
            .pause 3000
            .click("#list-container ul li")
            .waitFor 'a.button.first', 10000
            .click("a.button.first")
            .pause 6000
            .frame(null)
            .click('#test_unkown_assignment')
            .pause(2000)
            .frame('embed_iframe') # switch into lti frame
            .waitFor '.screen.board', 5000
            .getText 'header h1', (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe("Error - Unknown Assignment")
            .call done
    , 60000

testEnigma = (client) ->
    title = "Test widget"

    client
        .pause 100
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
        .pause 3000
        .frame(null) # switch back to main content
        .pause 3000
        .click('#creatorSaveBtn')
        #.waitFor('#saveBtnTxt:contains("Saved!")', 7000)
        .pause 3000
        .execute "return document.location.href.split('#')[1];", null, (err, result) ->
            instanceID = result.value
            expect(err).toBeNull()
            expect(instanceID.length).toBe(5)
        .click('#creatorPublishBtn')
        .waitFor('.publish.animate-show .publish_container a.action_button.green', 1000)
        .click('.publish.animate-show .publish_container a.action_button.green')
    true

