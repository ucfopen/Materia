describe('beardable Directive', function () {
	let $scope
	let $compile
	let createElementSpy
	let headAppendSpy
	let windowEventListenerSpy
	let html = '<div beardable>text</div>'

	let keyEvent = (code, unsetWhich = false) => {
		var e = new Event('keydown')
		e.keyCode = code
		e.which = code
		e.altKey = false
		e.ctrlKey = true
		e.shiftKey = false
		e.metaKey = false
		e.bubbles = true
		if (unsetWhich) delete e.which
		return e
	}

	beforeEach(() => {
		global.window.localStorage = { beardMode: 'false' }
		require('./dir-beardable')
		inject((_$compile_, _$rootScope_) => {
			$compile = _$compile_
			$scope = _$rootScope_.$new()
		})
		createElementSpy = jest.spyOn(document, 'createElement')
		headAppendSpy = jest.spyOn(document.head, 'appendChild')
		windowEventListenerSpy = jest.spyOn(window, 'addEventListener')
	})

	afterEach(() => {
		let css = document.getElementById('beard_css')
		if (css) css.parentElement.removeChild(css)
		createElementSpy.mockRestore()
		headAppendSpy.mockRestore()
		windowEventListenerSpy.mockRestore()
	})

	it('is disabled when beardmode is off and listens for keydown', () => {
		window.localStorage.beardMode = false
		let element = angular.element(html)
		let compiled = $compile(element)($scope)

		$scope.$digest()
		expect(createElementSpy).not.toHaveBeenLastCalledWith('link')
		expect(windowEventListenerSpy).toHaveBeenLastCalledWith('keydown', expect.any(Function))
	})

	it('is enabled when beardmode is on and listens for keydown', () => {
		global.window.localStorage.beardMode = 'true'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		expect(createElementSpy).toHaveBeenLastCalledWith('link')
		expect(headAppendSpy).toHaveBeenCalled()
		expect(windowEventListenerSpy).toHaveBeenLastCalledWith('keydown', expect.any(Function))
	})

	it('enables with the right key events', () => {
		global.window.localStorage.beardMode = 'false'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(66))
		expect(document.getElementById('beard_css')).toBeNull()
		window.dispatchEvent(keyEvent(65))
		expect(document.getElementById('beard_css')).not.toBeNull()
	})

	it('disables with the right key events are entered', () => {
		global.window.localStorage.beardMode = 'true'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		expect(document.getElementById('beard_css')).not.toBeNull()
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(66))
		expect(document.getElementById('beard_css')).not.toBeNull()
		window.dispatchEvent(keyEvent(65))
		expect(document.getElementById('beard_css')).toBeNull()
	})

	it('konami code resets when messed up', () => {
		global.window.localStorage = { beardMode: 'false' }
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		expect(document.getElementById('beard_css')).toBeNull()
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(66))
		window.dispatchEvent(keyEvent(66)) // this second a should cause the final b to reset
		window.dispatchEvent(keyEvent(10))
		expect(document.getElementById('beard_css')).toBeNull()

		// start over
		window.dispatchEvent(keyEvent(38, true))
		window.dispatchEvent(keyEvent(38))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(40))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(37))
		window.dispatchEvent(keyEvent(39))
		window.dispatchEvent(keyEvent(66))
		expect(document.getElementById('beard_css')).toBeNull()
		window.dispatchEvent(keyEvent(65))
		expect(document.getElementById('beard_css')).not.toBeNull()
	})
})
