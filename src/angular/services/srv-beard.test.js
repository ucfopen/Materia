describe('BeardServ', () => {
	var _service

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./srv-beard')
		inject(function (BeardServ) {
			_service = BeardServ
		})
	})

	it('defines expected methods', () => {
		expect(_service.getRandomBeard).toBeDefined()
	})

	it('getRandomBeard returns a random beard', () => {
		const mockMath = Object.create(global.Math)
		global.Math = mockMath

		mockMath.random = () => 0.2
		expect(_service.getRandomBeard()).toBe('dusty_full')

		mockMath.random = () => 0.4
		expect(_service.getRandomBeard()).toBe('black_chops')

		mockMath.random = () => 0.5
		expect(_service.getRandomBeard()).toBe('grey_gandalf')

		mockMath.random = () => 0.9
		expect(_service.getRandomBeard()).toBe('red_soul')
	})
})
