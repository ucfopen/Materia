setup = require('./_setup')

describe 'LTI iframe test', ->
	client = null
	widgetTitle = "Test widget"

	beforeEach ->
		unless client
			client = setup.getClient()
		client
			.url("#{setup.url}/lti/test/provider")
			.getTitle (err, title) -> expect(title).toBe('Materia Test as Provider')

	it 'should allow logging in as Instructor', (done) ->
		client
			.click('input[value="As Instructor"]:not(#play_as_instructor)')
			.frame('embed_iframe') # switch into lti frame
			.pause 1000
			.getText 'header h1', (err, text) -> expect(text).toBe('Select a Widget for use in Materia:')
			.call done

	it 'should allow logging in as New Instructor', (done) ->
		client
			.click('input[value="As NEW Instructor"]')
			.frame('embed_iframe') # switch into lti frame
			.call done

	it 'should show no widget warning', (done) ->
		client
			.click('input[value="As NEW Instructor"]')
			.pause(5000)
			.frame('embed_iframe') # switch into lti frame
			.getText '#no-widgets', (err, text) ->  expect(text).toContain("You don't have any widgets yet.")
			.call done

	it 'should allow refreshing after making new widget', (done) ->
		client
			.click('input[value="As Instructor"]:not(#play_as_instructor)')
			.frame('embed_iframe') # switch into lti frame
			.url "#{setup.url}/widgets/#{setup.enigma}/create"
		setup.testEnigma client, "widgetTitle", true
		client
			.url("#{setup.url}/lti/test/provider")
			.frame(null)
			.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.pause(1000)
			.getText 'body', (err, text) -> expect(text).toContain("basic_lti")
			.call done
	, 60000

	it 'should be playable by students', (done) ->
		client.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.frame(null)
			.click('input[value="As Learner"]')
			.frame('embed_iframe') # switch into lti frame
			.waitForExist('#container', 5000)
			.getAttribute '#container', 'src', (err, src) -> expect(src).toContain('player.html')
			# Disable alert warning since it crashes Selenium
			.execute 'window.onbeforeunload = null'
			.call done
	, 60000

	it 'should be playable by new students', (done) ->
		client.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.frame(null)
			.click('input[value="As NEW Learner"]')
			.frame('embed_iframe') # switch into lti frame
			.waitForExist('#container', 5000)
			.getAttribute '#container', 'src', (err, src) -> expect(src).toContain('player.html')
			# Disable alert warning since it crashes Selenium
			.execute 'window.onbeforeunload = null'
			.call done
	, 60000

	it 'should be playable by test student', (done) ->
		client.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.frame(null)
			.click('input[value="As Test Student"]')
			.frame('embed_iframe') # switch into lti frame
			.waitForExist('#container', 5000)
			.getAttribute '#container', 'src', (err, src) -> expect(src).toContain('player.html')
			# Disable alert warning since it crashes Selenium
			.execute 'window.onbeforeunload = null'
			.call done
	, 60000

	it 'should be show success to instructors', (done) ->
		client.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.frame(null)
			.click '#play_as_instructor'
			.frame 'embed_iframe' # switch into lti frame
			.pause 1000
			.getText 'header h1', (err, text) -> expect(text).toBe("Success")
			.call done
	, 60000

	it 'should pass oauth validation', (done) ->
		client.click('input[value="Test Validation"]')
		client
			.frame('embed_iframe') # switch into lti frame
			.pause(200)
			.getText 'body', (err, body) -> expect(body).toContain("PASSED!")
			.call done
	, 60000

	it 'should warn unknown assignments', (done) ->
		client.click('input[value="As Instructor"]:not(#play_as_instructor)')
		selectFirstWidget(client)
		client
			.frame(null)
			.click('#test_unkown_assignment')
			.frame('embed_iframe') # switch into lti frame
			.pause 1000
			.getText 'header h1', (err, title) -> expect(title).toBe("Error - Unknown Assignment")
			.call done
			.end(done)
	, 60000

selectFirstWidget = (client) ->
	client
		.frame 'embed_iframe' # switch into lti frame
		.waitForExist '#list-container .widget-info', 18000
		.click "#list-container ul li"
		.click "a.button.first"
		.pause(12000) # Wait for progress bar to finish & disappear
		.getText 'body', (err, text) -> expect(text).toContain("basic_lti")

