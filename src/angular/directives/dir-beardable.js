'use strict'

const app = angular.module('materia')
app.directive('beardable', function () {
	return {
		restrict: 'A',
		controller($window) {
			let beardMode = $window.localStorage.beardMode === 'true'
			let konami = ''

			const updateBeardCss = () => {
				const hasBeardCss = document.getElementById('beard_css') != null
				if (beardMode && !hasBeardCss) {
					// enabled and needs css
					const link = document.createElement('link')
					link.id = 'beard_css'
					link.rel = 'stylesheet'
					link.href = `${STATIC_CROSSDOMAIN}css/beard-mode.css`
					document.head.appendChild(link)
				} else if (hasBeardCss) {
					// disabled and has css
					const css = document.getElementById('beard_css')
					css.parentElement.removeChild(css)
				}
			}

			const konamiListener = (event) => {
				switch (event.which || event.keyCode) {
					case 38:
						if (konami !== 'u') {
							konami = ''
						}
						konami += 'u'
						break
					case 40:
						konami += 'd'
						break
					case 37:
						konami += 'l'
						break
					case 39:
						konami += 'r'
						break
					case 66:
						konami += 'b'
						break
					case 65:
						konami += 'a'
						break
					default:
						konami = ''
				}

				if (konami === 'uuddlrlrba') {
					beardMode = !beardMode
					updateBeardCss()

					$window.localStorage.beardMode = beardMode
				}
			}

			$window.addEventListener('keydown', konamiListener)

			updateBeardCss()
		},
	}
})
