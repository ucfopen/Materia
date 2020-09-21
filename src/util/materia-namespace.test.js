describe('Namespace', () => {
	beforeEach(() => {
		require('./materia-namespace')
	})

	it('exists on window', () => {
		expect(window.Namespace).toBeDefined()
	})

	it('defines ns objects as needed', () => {
		expect(window.Namespace('Materia')).toMatchObject({})
		expect(window.Namespace('Materia.another-thing')).toMatchObject({})
		expect(window.Namespace('Materia')).toHaveProperty('another-thing')

		window.Namespace('Materia.another-thing').thing = 123
		expect(window.Namespace('Materia.another-thing')).toMatchObject({ thing: 123 })
	})
})
