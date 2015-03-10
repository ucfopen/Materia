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
	engima: "3-enigma"
	webdriverOptions:
		desiredCapabilities:
			browserName: process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
		logLevel: "silent" # verbose, silent, command, data, result
	testEnigma: (client, title, publish = false) ->
		client
			.pause 100
			.waitFor('#container', 7000)
			.getTitle (err, title) -> expect(title).toBe('Create Widget | Materia')
			.frame('container') # switch into widget frame
			.waitForVisible('.intro.show', 7000)
			.setValue('.intro.show input[type=text]', title)
			.click('.intro.show input[type=button]')
			.setValue('#category_0', 'Test')
			.click('.category:first-of-type button.add:not(.ng-hide)')
			.setValue('#question_text', 'Test question')
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
	loginAt: (client, user, url) ->
		client
			.url(url)
			.waitForVisible '#username', 2000
			.getTitle (err, title) -> expect(title).toBe('Login | Materia')
			.setValue('#username', user.username)
			.setValue('#password', user.password)
			.click('form button.action_button')
			.pause(800)
		return client

jasmine.getEnv().defaultTimeoutInterval = 30000

