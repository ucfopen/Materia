# To Run
# 1. download selenium server
# 2. optionally download chromedriver
# 3. install jasmine node globally
#   - npm install jasmine-node -g
# 4. get node libraries
#   - cd to/materia/dir/
#   - npm install
# 5. run the selenium server:
#   - java -jar selenium-server-standalone-2.37.0.jar
#   - or with chrome: -Dwebdriver.chrome.driver=/path/to/chromedriver
# 6. run the tests
#   - jasmine-node spec/materia.spec.coffee --coffee
#   - or optional set browser: env BROWSER=chrome jasmine-node spec/materia.spec.coffee --coffee
#   
# Useful links
# https://github.com/camme/webdriverjs
# http://pivotal.github.io/jasmine/
# https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.with.jasmine.spec.js

webdriverjs = require('webdriverjs')
testBrowser = process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
jasmine.getEnv().defaultTimeoutInterval = 30000
author =
	username: '~author'
	password: 'kogneato'
student =
	username: '~student'
	password: 'kogneato'

webdriverOptions = { desiredCapabilities: {browserName: testBrowser}, logLevel: "silent" }

console.log "Running #{testBrowser} with #{author.username} and #{student.username}"

describe 'Homepage', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should display correctly', (done) ->
        client
            .url('http://localhost:8080/')
            .getTitle( (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Welcome to Materia | Materia')
            )
            .waitFor('.store_main', 7000)
            .isVisible('.store_main:first-child section')
            .execute('return $(".store_main section").length;', null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBeGreaterThan(0)
            )
            .click('.span_next:last-child')
            .pause(1500)
            .isVisible('.store_main:last-child section')
            .pause(2000)
            .call(done)

describe 'Widget Catalog Page', ->
    client = {}
    client = webdriverjs.remote(webdriverOptions)
    client.init()

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

describe 'Login Page', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should display an error on incorrect login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .getText '.detail h3', (err, text) ->
                expect(err).toBeNull()
                expect(text).toContain('Using your')
            .click('form button.action_button')
            .isVisible('.error')
            .getText '.error', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('ERROR: Username and/or password incorrect.')
            .call(done)

    it 'should relocate to my widgets on author login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .call(done)

    it 'should relocate to my profile on student login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', student.username)
            .setValue('#password', student.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Profile | Materia')
            .call(done)

    it 'should display user info in header', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .getText '.user', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Welcome Prof Author')
            .getText '.logout', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Logout')
            .isVisible('.user.avatar')
            .call(done)

describe 'Profile page', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should display profile', (done) ->
        client
            .url('http://localhost:8080/profile')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .url('http://localhost:8080/profile')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Profile | Materia')
            .getText '.page h2', (err, text) ->
                expect(err).toBeNull()
                expect(text).toContain('Prof Author')
            .isVisible('.avatar_big')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            .call(done)

describe 'When not logged in', ->
    client = {}
    client = webdriverjs.remote(webdriverOptions)
    client.init()

    it ' settings should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .call(done)

    it ' my-widgets should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .call(done)

    it ' profile should redirect to login', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .call(done)
            .call -> client.end(done)


describe 'Settings page', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should display profile', (done) ->
        client
            .url('http://localhost:8080/settings')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')

            # Check page state
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Settings | Materia')
            .isVisible('.avatar_big')
            .getAttribute 'form button.action_button', 'disabled', (err, disabled) ->
                expect(err).toBeNull()
                expect(disabled).toContain('true')

            # Reset 
            # no avatar
            # no notify
            .click('#avatar_default')
            .execute 'return $("#notify_on_perm_change:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                if isChecked.value
                    client.click('#notify_on_perm_change')
            .getAttribute 'form button.action_button', 'class', (err, classes) ->
                expect(err).toBeNull()
                expect(classes).not().toContain('disabled')
            .click('form button.action_button')

            # Check that page displays expected options
            .waitFor('.settingSaveAlert', 7000)
            .isSelected('#avatar_default')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).not().toContain('gravatar')
                expect(src).toContain('robohash.org/')
            .execute 'return $("#notify_on_perm_change:checked").length;', null, (err, isChecked) ->
                expect(err).toBeNull()
                expect(isChecked.value).toBe(0)
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).not().toContain('gravatar')
                expect(src).toContain('robohash.org/')

            .refresh()

            # check again that page displays expected options
            .execute "return $('#notify_on_perm_change:checked').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(0)
            .isSelected('#avatar_default')
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).not().toContain('gravatar')
                expect(src).toContain('robohash.org/')

            # Turn on stuff
            # gravatar yes
            # notifications yes
            .click('#avatar_gravatar')
            .click('#notify_on_perm_change')
            .click('form button.action_button')

            # check that new options are set
            .waitFor('.settingSaveAlert', 7000)
            .isSelected('#avatar_gravatar')
            .isVisible('#notify_on_perm_change:checked')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .refresh()

            # check again that page displays expected options
            .isSelected('#avatar_gravatar')
            .isVisible('#notify_on_perm_change:checked')
            .getAttribute '.avatar_big img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('100')
            # check the header too
            .getAttribute 'header span .user.avatar img', 'src', (err, src) ->
                expect(err).toBeNull()
                expect(src).toContain('gravatar')
                expect(src).toContain('robohash.org/')
                expect(src).toContain('24')

            .call(done)

describe 'Help Page', ->
    client = {}
    

    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should redirect to login when not logged in', (done) ->
        client
            .url('http://localhost:8080/help')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Help | Materia')
            .getText '.page h1', (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Help & Support')
            .call(done)

describe 'Widget Exists', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

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

describe 'When I create a widget', ->
    client = {}
    randomId = Math.random()
    title = 'Selenium Test Enigma Widget '+randomId
    cleanTitle = title.replace(' ', '-').replace('.', '-')
    instanceID = null

    # Reuse session to keep from having to log in
    client = webdriverjs.remote(webdriverOptions)
    client.init()

    it 'it should update hash url', (done) ->
        client
            .url('http://localhost:8080/widgets')
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
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
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
            .waitFor('#saveBtnTxt:contains("Saved!")', 7000)
            .execute "return document.location.href.split('#')[1];", null, (err, result) ->
                console.log 'instance id', result.value
                instanceID = result.value
                expect(err).toBeNull()
                expect(instanceID.length).toBe(5)
            .call(done)
    , 25000

    it 'it should appear as a draft', (done) ->
        client
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

    it 'it should display correctly on my widgets page', (done) ->
        client
            .url('http://localhost:8080/my-widgets#'+instanceID)
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

    it 'it should collaborate', (done) ->
        client
            .url('http://localhost:8080/my-widgets#'+instanceID)
            .waitFor('#'+instanceID, 7000)
            .pause(1500)
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
        copyTitle = 'Selenium Copy Test '+randomId
        client
            .url('http://localhost:8080/my-widgets#'+instanceID)
            .pause 1900
            .waitFor('#'+instanceID, 7000)
            .waitFor('.widget.gameSelected li.title:contains("'+title+'")', 7000)
            .click('#copy_widget_link')
            .isVisible('.ng-modal-title')
            .getText '.copy .ng-modal-title', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Make a Copy:')
            .setValue('.newtitle', copyTitle)
            .click('.copy_button.action_button')
            # copy shows up in list
            .pause 1900
            .waitFor('li.title:contains("'+copyTitle+'")', 7000)
            # copy is auto-selected
            .pause 1900
            .waitFor('.widget.gameSelected li.title:contains("'+copyTitle+'")', 7000)
            # copy is selected and displayed on main section
            .getText '.container .page h1', (err, mode) ->
                expect(err).toBeNull()
                expect(mode).toBe(copyTitle)
            .call(done)
    , 45000

    it 'it should delete using the delete button', (done) ->
        client
            .url('http://localhost:8080/my-widgets#'+instanceID)
            .pause(2000)
            .waitFor('#'+instanceID+'.gameSelected', 5000)
            .click('.controls #delete_')
            .waitFor('.controls .delete_dialogue', 5000)
            .isVisible('.delete_dialogue')
            .click('.delete_button')
            .pause(2000)
            .execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(1)
            .refresh()
            .waitFor('.widget', 5000)
            .pause(2000)
            .execute "return $('#widget_"+instanceID+"').length;", null, (err, result) ->
                expect(err).toBeNull()
                expect(result.value).toBe(1)
            .pause(1800)
            .isVisible('.error-nowidget')
            .call(done)
            .call -> client.end(done)
    , 25000

describe 'My Widgets Page', ->
    client = {}
    
    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()

    afterEach (done) ->
        client.end(done)

    it 'should relocate to my widgets on author login', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .call(done)

    it 'should display instructions by default', (done) ->
        client
            .url('http://localhost:8080/login')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Login | Materia')
            .setValue('#username', author.username)
            .setValue('#password', author.password)
            .click('form button.action_button')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('My Widgets | Materia')
            .waitFor '.directions.unchosen p', 5000
            .getText '.directions.unchosen p', (err, text) ->
                expect(err).toBeNull()
                expect(text).toBe('Choose a widget from the list on the left.')
            .call(done)
describe 'LTI iframe test', ->
    client = {}

    beforeEach ->
        client = webdriverjs.remote(webdriverOptions)
        client.init()
        client
            .url('http://localhost:8080/lti/test/provider')
            .getTitle (err, title) ->
                expect(err).toBeNull()
                expect(title).toBe('Materia Test as Provider')

    afterEach (done) ->
        client.end(done)

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
            .waitFor '*:contains("Success!")', 10000
            .pause 5000
            .getText 'body', (err, text) ->
                expect(err).toBeNull()
                expect(text).toContain("basic_lti")
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
        .frame(null) # switch back to main content
        .click('#creatorSaveBtn')
        .waitFor('#saveBtnTxt:contains("Saved!")', 7000)
        .execute "return document.location.href.split('#')[1];", null, (err, result) ->
            console.log 'instance id', result.value
            instanceID = result.value
            expect(err).toBeNull()
            expect(instanceID.length).toBe(5)
        .click('#creatorPublishBtn')
        .waitFor('.publish .publish_container a.action_button.green', 1000)
        .click('.publish .publish_container a.action_button.green')
    true

