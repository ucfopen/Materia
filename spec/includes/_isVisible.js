/**
 * See https://github.com/webdriverio/webdriverio/blob/master/lib/helpers/_isVisible.js
 */

/* global document,window */
module.exports = function(elements, reverse) {
	var cb = arguments[arguments.length - 1],
		db = document.body,
		dde = document.documentElement;

	if(elements.length === 0) {
		throw new Error('NoSuchElement');
	}

	var interval = setInterval(function() {

		for (var i = 0; i < elements.length; ++i) {
			var elem = elements[i],
				conditionFulfilled = reverse ? false : true;

			while (elem.parentNode && elem.parentNode.getBoundingClientRect) {

				var condition = false,
					elemDimension = elem.getBoundingClientRect(),
					elemComputedStyle = window.getComputedStyle(elem);

				if ((!reverse &&
					elemComputedStyle.display !== 'none' &&
					elemComputedStyle.visibility === 'visible' &&
					parseFloat(elemComputedStyle.opacity, 10) > 0 &&
					elemDimension.width >= 0 &&
					elemDimension.height >= 0) ||

					(reverse &&
					(elemComputedStyle.display === 'none' ||
					elemComputedStyle.visibility === 'hidden' ||
					parseFloat(elemComputedStyle.opacity, 10) === 0 ||
					elemDimension.width === 0 ||
					elemDimension.height === 0))) {

					condition = true;

				}

				if(reverse) {
					/**
					 * if reverse is true (waitForInvisible) the condition is fulfilled
					 * when at least one element is hidden
					 */
					conditionFulfilled = conditionFulfilled || condition;
				} else {
					/**
					 * if reverse is false (waitForVisible (default)) the condition is fulfilled
					 * when each element is visible
					 */
					conditionFulfilled = conditionFulfilled && condition;
				}
				elem = elem.parentNode;

			}

			if(conditionFulfilled) {
				window.clearInterval(interval);
				return cb(true);
			}

		}

	}, 100);
};