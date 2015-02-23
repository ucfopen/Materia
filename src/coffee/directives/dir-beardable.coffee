'use strict'

app = angular.module 'materia'
app.directive 'beardable', ->
	restrict: 'A',
	controller: ($scope, $element, $attrs) ->

		beardMode = window.localStorage.beardMode is "true"
		konami = ''

		updateBeardCss = ->
			hasBeardCss = document.getElementById('beard_css')?
			if beardMode and not hasBeardCss
				link = document.createElement "link"
				link.id = "beard_css"
				link.rel = "stylesheet"
				link.href = "/themes/default/assets/css/beard_mode.css"
				document.head.appendChild link
			else if hasBeardCss
				css = document.getElementById('beard_css')
				css.parentElement.removeChild css

		konamiListener = (event) ->
			switch event.which or event.keyCode
				when 38
					konami = '' if konami isnt 'u'
					konami += 'u'
				when 40
					konami += 'd'
				when 37
					konami += 'l'
				when 39
					konami += 'r'
				when 66
					konami += 'b'
				when 65
					konami += 'a'
				else
					konami = ''

			if konami == 'uuddlrlrba'
				beardMode = !beardMode
				updateBeardCss()

				window.localStorage.beardMode = beardMode

		window.addEventListener "keydown", konamiListener

		updateBeardCss()
