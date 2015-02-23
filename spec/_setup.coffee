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
	webdriverjs: require 'webdriverjs'
	author:
		username: '~author'
		password: 'kogneato'
	student:
		username: '~student'
		password: 'kogneato'
	webdriverOptions:
		desiredCapabilities:
			browserName: process.env.BROWSER || 'firefox' # phantomjs, firefox, 'safari'. 'chrome'
		logLevel: "silent"

jasmine.getEnv().defaultTimeoutInterval = 30000
