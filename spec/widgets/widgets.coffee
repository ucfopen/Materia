# Widget loader code
# This is imported by all the individual widget specs

webdriverjs = require('webdriverio')
testBrowser = process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
jasmine.getEnv().defaultTimeoutInterval = 10000
author =
	username: '~author'
	password: 'kogneato'

module.exports = (widget, callback) ->
	console.log "Testing " + widget
	client = webdriverjs.remote({ desiredCapabilities: {browserName: testBrowser}, logLevel: "silent" })
	client.init()
	client.windowHandlePosition 'current', { x: 0, y: 0 }
	client.windowHandleSize 'current', { width: 1200, height: 650 }

	# client
	# 	.url('http://localhost:8080/login')
	# 	.getTitle (err, title) ->
	# 		expect(title).toBe('Login | Materia')
	# 	.waitFor '#username'
	# 	.setValue('#username', author.username)
	# 	.setValue('#password', author.password)
	# 	.click('form button.action_button')

	client
		.url('http://localhost:8080/widgets')
		.waitFor('.widgets', 5000)
		.waitFor('.' + widget, 5000)
		.click('.' + widget + ' a', 5000)
		.waitFor('#demoLink', 5000)
		.execute "return location.href", null, (err, result) ->
			client
				.url(result.value + '/demo')
				.pause 1000
				.getTitle (err, res) ->
					client
						.waitFor('iframe#container')
						.frame('container')
						.call(callback)


