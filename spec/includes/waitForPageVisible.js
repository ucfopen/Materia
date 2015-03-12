/**
 *
 * See https://github.com/webdriverio/webdriverio/blob/master/lib/commands/waitForVisible.js
 *
 */

var async = require('../../node_modules/webdriverio/node_modules/async/lib/async'),
	isVisibleFunc = require('./_isVisible.js'),
	ErrorHandler = require('../../node_modules/webdriverio/lib/utils/ErrorHandler.js');

module.exports = function waitForPageVisible(selector, ms, reverse) {

	/*!
	 * make sure that callback contains chainit callback
	 */
	var callback = arguments[arguments.length - 1];

	/*!
	 * parameter check
	 */
	if (typeof selector !== 'string') {
		return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitForVisible command'));
	}

	/*!
	 * ensure that ms is set properly
	 */
	if (typeof ms !== 'number') {
		ms = this.options.waitforTimeout;
	}

	if (typeof reverse !== 'boolean') {
		reverse = false;
	}

	var self = this,
		response = {};

	async.waterfall([
		function(cb) {
			self.timeoutsAsyncScript(ms, cb);
		},
		function(res, cb) {
			response.timeoutsAsyncScript = res;
			self.selectorExecuteAsync(selector, isVisibleFunc, reverse, cb);
		},
		function(result, res, cb) {
			response.selectorExecuteAsync = res;
			cb();
		}
	], function(err) {

		callback(err, response.selectorExecuteAsync && response.selectorExecuteAsync.executeAsync ? response.selectorExecuteAsync.executeAsync.value : false, response);

	});

};