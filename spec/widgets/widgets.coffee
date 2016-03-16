# Widget loader code
# This is imported by all the individual widget specs

webdriverjs = require('webdriverio')
testBrowser = process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
jasmine.getEnv().defaultTimeoutInterval = 50000
author =
	username: '~author'
	password: 'kogneato'
environment =
	url: 'http://192.168.99.100'

module.exports = (widget, callback) ->
	console.log "Testing " + widget
	client = webdriverjs.remote({ desiredCapabilities: {browserName: testBrowser}, logLevel: "silent" })
	client.init()
	client.windowHandlePosition 'current', { x: 0, y: 0 }
	client.windowHandleSize 'current', { width: 1200, height: 650 }

	waitForPageVisible = require '../includes/waitForPageVisible.js'
	client.addCommand 'waitForPageVisible', waitForPageVisible

	# client
	# 	.url('http://localhost:8080/login')
	# 	.getTitle (err, title) ->
	# 		expect(title).toBe('Login | Materia')
	# 	.waitFor '#username'
	# 	.setValue('#username', author.username)
	# 	.setValue('#password', author.password)
	# 	.click('form button.action_button')

	client
		.url("#{environment.url}/widgets")
		.waitFor(".widget.#{widget}", 3000)
		.moveToObject(".widget.#{widget} .infocard", 10, 10)
		.waitFor('.infocard:hover .header h1', 4000)
		.click('.infocard:hover .header')
		.waitForPageVisible('#demoLink', 7000)
		.execute "return location.href", null, (err, result) ->
			client
				.url(result.value + '/demo')
				.pause 1000
				.getTitle (err, res) ->
					client
						.waitFor('iframe#container')
						.frame('container')
						.call(callback)


