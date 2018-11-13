/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 213);
/******/ })
/************************************************************************/
/******/ ({

/***/ 213:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(8);
module.exports = __webpack_require__(214);


/***/ }),

/***/ 214:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var app = angular.module('materia');
app.controller('guideCtrl', ['Please', '$scope', '$q', 'widgetSrv', function (Please, $scope, $q, widgetSrv) {
    var widget_info = null;
    var instance = null;
    var nameArr = null;
    var guideType = null;
    var guide = null;

    // Refactor this: with regex
    if (window.location.pathname.includes("creatorGuide.html")) {
        nameArr = window.location.pathname.replace('/widgets/', '').replace('/creatorGuide.html', '').split('/');
        guideType = "creatorGuide";
    } else {
        nameArr = window.location.pathname.replace('/widgets/', '').replace('/playerGuide.html', '').split('/');
        guideType = "playerGuide";
        console.log(guideType);
    }

    var widgetID = nameArr.pop().split('-').shift();

    var embed = function embed(widgetData) {
        var path = void 0;
        var findPath = function findPath(guide) {
            if (guide.substring() === 'http') {
                return guide;
            } else {
                return WIDGET_URL + widget_info.dir + guide;
            }
        };

        if (widgetData != null ? widgetData.widget : undefined) {
            instance = widgetData;
            widget_info = instance.widget;
        } else {
            widget_info = widgetData;
        }

        if (guideType == 'creatorGuide') {
            path = findPath(widget_info.creator_guide);
        } else {
            path = findPath(widget_info.player_guide);
        }

        $scope.helper = path;
        Please.$apply();
    };

    widgetSrv.getWidgetInfo(widgetID).then(embed);
}]);

/***/ }),

/***/ 8:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Creates a nested namespace on window (non-destructive)
//
// Namespace('Some.Nested').wohoo = 5
// creates:
// {
// 	Some: {
// 		Nested: {
//			wohoo: 5
// 		}
// 	}
// }
window.Namespace = function (ns) {
	var namespaces = ns.split('.');
	var w = window;

	namespaces.forEach(function (namespace) {
		w[namespace] = w[namespace] || {};
		w = w[namespace]; // recurse down
	});

	return w;
};

/***/ })

/******/ });