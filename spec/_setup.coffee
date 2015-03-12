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
#   - jasmine-node spec/ --coffee
#   - or optional set browser: env BROWSER=chrome jasmine-node spec/ --coffee
#
# Useful links
# https://github.com/camme/webdriverjs
# http://pivotal.github.io/jasmine/
# https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.with.jasmine.spec.js


module.exports =
	webdriver: require 'webdriverio'
	url: 'http://localhost:8080'
	author:
		username: '~author'
		password: 'kogneato'
		name: 'Prof Author'
	student:
		username: '~student'
		password: 'kogneato'
		name: 'John Student'
	enigma: "3-enigma"
	webdriverOptions:
		desiredCapabilities:
			browserName: process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
		logLevel: "verbose" # verbose, silent, command, data, result
	getClient: ->
		client = module.exports.webdriver.remote(module.exports.webdriverOptions).init()

		# client.windowHandleMaximize 'current'
		client.windowHandlePosition 'current', { x: 0, y: 0 }
		client.windowHandleSize 'current', { width: 1200, height: 650 }

		waitForPageVisible = require './includes/waitForPageVisible.js'
		client.addCommand 'waitForPageVisible', waitForPageVisible

		return client
	testEnigma: (client, title, publish = false) ->
		client
			.pause 100
			.waitFor('#container', 7000)
			.getTitle (err, title) -> expect(title).toBe('Create Widget | Materia')
			.frame('container') # switch into widget frame
			.waitForPageVisible('.intro.show', 7000)
			.setValue('.intro.show input[type=text]', title)
			.click('.intro.show input[type=button]')
			.setValue('#category_0', 'Test')
			.click('.category:first-of-type button.add:not(.ng-hide)')
			.setValue('#question_text', 'Test question')
			.click '.right .checktoggle'
			.click '.checktoggle.correctness'
			.click '.controls input[type=button]'
			.pause 100
			.frame(null) # switch back to main content
			.click('#creatorSaveBtn')
			.waitFor('#creatorSaveBtn.saving', 1000)
			.waitFor('#creatorSaveBtn.saved', 5000)
			.execute "return document.location.href.split('#')[1];", null, (err, result) -> expect(result.value.length).toBe(5)
		if (publish)
			client
				.waitFor('#creatorSaveBtn.idle', 5000)
				.click('#creatorPublishBtn')
				.waitFor('.publish.animate-show .publish_container a.action_button.green', 1000)
				.click('.publish.animate-show .publish_container a.action_button.green')
		return client
	playEnigma: (client) ->
		client
			.pause 100
			.waitFor '#container', 7000
			.frame('container') # switch into widget frame
			.waitForPageVisible '.question.unanswered', 7000
			.click '.question.unanswered'
			.waitForPageVisible '.answers label', 7000
			.click '.answers label'
			.waitForPageVisible '.answers label'
			.click '.button.submit'
			.waitForPageVisible '.button.return.highlight', 7000
			.click '.button.return.highlight'
			.waitForPageVisible '.notice button', 7000
			.click '.notice button'
			.pause 3000 # wait for score submit
		return client
			# .execute ->
			# 	# this happens in the browser
			# 	setInterval ->
			# 		if document.location.hash.indexOf('score') == 1
			# 			return true
			# 	, 500
			# , ->
			# 	callback client
	loginAt: (client, user, url) ->
		client
			.url(url)
			.waitForPageVisible '#username', 2000
			.getTitle (err, title) -> expect(title).toBe('Login | Materia')
			.setValue('#username', user.username)
			.setValue('#password', user.password)
			.click('form button.action_button')
			.pause(800)
		return client

jasmine.getEnv().defaultTimeoutInterval = 30000

