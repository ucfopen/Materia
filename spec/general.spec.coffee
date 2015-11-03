setup = require('./_setup')

describe 'General', ->
    instanceID = null
    title = 'Selenium Test Enigma Widget '+Math.random()
    client = null

    beforeEach ->
      unless client
          client = setup.getClient()

    it 'should show a notification when a widget I own has been deleted', (done) ->
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
                client
                    .url("#{setup.url}/my-widgets#/"+instanceID)
                    .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
                    .waitForPageVisible '.share div.link', 7000
                    .pause 1000
                    .click '.share div.link'
                    .waitFor '.share .ng-modal-title', 7000
                    .setValue '.user_add', 'student'
                    .waitFor '.search_match', 7000
                    .click '.search_match'
                    .pause 1000
                    .waitFor '.user_perm:nth-Child(2) select', 7000
                    .selectByIndex '.user_perm:nth-child(2) select', 0
                    .click '.save_button'
                    .pause 2000
                    .click '.logout a'
                setup.loginAt client, setup.student, "#{setup.url}/users/login"
                client
                    .call -> expect(instanceID.length).toBe(5)
                    .url('http://localhost:8080/my-widgets#/'+instanceID)
                    .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
                    .waitForPageVisible '.delete div.link', 7000
                    .pause 1000
                    .click '.delete div.link'
                    .waitFor '.delete_dialogue .delete_button'
                    .click '.delete_dialogue .delete_button'
                    .pause 2000
                    .click '.logout a'
                setup.loginAt client, setup.author, "#{setup.url}/users/login"
                client
                    .waitFor '#notifications_link', 7000
                    .click '#notifications_link'
                    .waitFor '#notices .notice .notice_right_side', 7000
                    .getText '#notices .notice:last-child .notice_right_side', (err, text) ->
                        expect(text).toContain('deleted')
                        expect(text).toContain(title)
                    .call done
    , 55000


    it 'should show a notification when my access changes for a widget', (done) ->
        client
            .url("#{setup.url}/widgets")
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
                client
                    .url("#{setup.url}/my-widgets#/"+instanceID)
                    .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
                    .waitForPageVisible '.share div.link', 7000
                    .pause 1000
                    .click '.share div.link'
                    .waitFor '.share .ng-modal-title', 7000
                    .setValue '.user_add', 'student'
                    .waitFor '.search_match', 7000
                    .click '.search_match'
                    .pause 1000
                    .waitFor '.user_perm:nth-Child(2) select', 7000
                    .selectByIndex '.user_perm:nth-child(2) select', 0
                    .click '.save_button'
                    .pause 2000
                    .click '.logout a'
                setup.loginAt client, setup.student, "#{setup.url}/users/login"
                client
                    .call -> expect(instanceID.length).toBe(5)
                    .url('http://localhost:8080/my-widgets#/'+instanceID)
                    .waitFor('#widget_'+instanceID+'.gameSelected', 7000)
                    .waitForPageVisible '.share div.link', 7000
                    .pause 1000
                    .click '.share div.link'
                    .waitFor '.share .ng-modal-title', 7000
                    .waitFor '.user_perm:nth-Child(2) select', 7000
                    .selectByIndex '.user_perm:nth-child(2) select', 1
                    .click '.save_button'
                    .pause 2000
                    .click '.logout a'
                setup.loginAt client, setup.author, "#{setup.url}/users/login"
                client
                    .waitFor '#notifications_link', 7000
                    .click '#notifications_link'
                    .waitFor '#notices .notice .notice_right_side', 7000
                    .getText '#notices .notice:last-child .notice_right_side', (err, text) ->
                        expect(text).toContain('changed')
                        expect(text).toContain(title)
                    .call done
    , 55000


    it 'should remove all notifications when dismissing all notifications I have', (done) ->
        client
            .getAttribute 'a#notifications_link', 'data-notifications', (err, text) ->
                for i in [0..parseInt(text)-1]
                  client
                      .waitFor '#notices a.noticeClose', 7000
                      .click '#notices a.noticeClose'
                client
                    .pause(2000)
                    .isVisible '#notifications_link', (err, visibility) ->
                        expect(visibility).toBe(false)
            .end done
    , 55000
