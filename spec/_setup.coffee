# To Run
# 1. download selenium standalone server 2.45.0
# 2. optionally download chromedriver to test using google chrome (uses firefox be default)
# 3. install jasmine node globally
#   - npm install jasmine-node -g
# 4. install materia node libraries
#   - cd to/materia/current/
#   - npm install
# 5. run the selenium server wherever you put it:
#   - java -jar selenium-server-standalone-2.45.0.jar
#   - optional use chrome: java -jar -Dwebdriver.chrome.driver=/path/to/chromedriver selenium-server-standalone-2.45.0.jar
# 6. run the tests
#   - jasmine-node spec/ --coffee --verbose --captureExceptions
#   - optional just test widgets: jasmine-node spec/widgets/ --coffee
#   - optional set browser: env BROWSER=chrome jasmine-node spec/ --coffee
#
# Useful links
# https://github.com/camme/webdriverjs
# http://pivotal.github.io/jasmine/
# https://github.com/camme/webdriverjs/blob/master/examples/webdriverjs.with.jasmine.spec.js


module.exports =
	webdriver: require 'webdriverio'
	url: 'http://192.168.99.100'
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
			browserName: process.env.BROWSER || 'phantomjs' # phantomjs, firefox, 'safari'. 'chrome'
		logLevel: "silent" # verbose, silent, command, data, result
	getClient: ->
		client = module.exports.webdriver.remote(module.exports.webdriverOptions).init()

		# client.windowHandleMaximize 'current'
		client.windowHandlePosition 'current', { x: 0, y: 0 }
		client.windowHandleSize 'current', { width: 1200, height: 650 }

		# cycles through every window, looking for one whose url contains partialUrl
		client.addCommand 'waitForUrlContains', (partialUrl, ms, callback) ->
			client = this
			curTime = 0
			intervalMs = 500
			initialTabId = null

			client.getCurrentTabId (err, tabId, res) ->
				initialTabId = tabId

				intervalId = setInterval ->
					curTime += intervalMs
					if curTime > ms
						clearInterval intervalId
						client.switchTab initialTabId
						callback "URL did not match #{partialUrl}", null, client
						return

					client.getTabIds (err, val, res) ->
						for tabId in val
							client.switchTab tabId
							client.url (err, res) ->
								if res.value.indexOf(partialUrl) > -1
									clearInterval intervalId
									client.switchTab initialTabId
									callback null, res.value, client
				, intervalMs


		return client
	testEnigma: (client, title, publish = false) ->
		client
			.pause 100
			.getTitle (err, title) -> expect(title).toBe('Create Widget | Materia')
			.frame('container') # switch into widget frame
			.setValue('.intro.show input[type=text]', title)
			.click('.intro.show button')
			.setValue('#category_0', 'Test')
			.pause 500
			.click('.category:first-of-type button.add:not(.ng-hide)')
			.setValue('#question_text', 'Test question')
			.click('label[for=qtoggle0]')
			.setValue('.questions textarea', 'Some answer')
			.scroll 0, 200
			.click '.submit.action'
			.frame(null) # switch back to main content
			.scroll('#creatorSaveBtn', 0, 0)
			.click('#creatorSaveBtn')
			.pause(5000)
			.execute "return document.location.href.split('#')[1];", null, (err, result) ->
				expect(result.value.length).toBe(5)
		if (publish)
			client
				.click('#creatorPublishBtn')
				.click('.publish.animate-show:nth-of-type(2) .publish_container a.action_button.green')
		return client
	loginAt: (client, user, url) ->
		client
			.url(url)
			.getTitle (err, title) -> expect(title).toBe('Login | Materia')
			.setValue('#username', user.username)
			.setValue('#password', user.password)
			.click('form button.action_button')
			.pause(800)
		return client

	playEnigma: (client) ->
		client
			.pause 100
			.frame('container') # switch into widget frame
			.click '.question.unanswered'
			.click '.answers label'
			.click '.button.submit'
			.click '.button.return.highlight'
			.click '.notice button'
			.pause 3000 # wait for score submit
		return client

jasmine.getEnv().defaultTimeoutInterval = 50000

