describe('Materia.Storage.Manager', () => {
	let Storage
	let mockTable
	let mockSendStorage

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./materia.storage.manager')
		Storage = Materia.Storage.Manager
		Namespace('Materia.Storage').Table = mockTable = jest.fn()
		Namespace('Materia.Engine').sendStorage = mockSendStorage = jest.fn()
	})

	it('defines expected public methods', () => {
		expect(Storage.addTable).toBeDefined()
		expect(Storage.clean).toBeDefined()
		expect(Storage.insert).toBeDefined()
		expect(Storage.getTable).toBeDefined()
	})

	it('addTable throws error if table isnt created', () => {
		expect(() => {
			Storage.addTable('table_name', 'col1', 'col2')
		}).toThrow("Table 'table_name' already exists")
	})

	it('addTable creates a table', () => {
		let table = { init: jest.fn(), getId: () => 'table_name' }
		mockTable.mockReturnValueOnce(table)
		Storage.addTable('table_name', 'col1', 'col2')
		expect(table.init).toHaveBeenLastCalledWith('table_name', ['col1', 'col2'])

		expect(Storage.getTable('table_name')).toBe(table)
	})

	it('addTable prevents adding a duplicate table', () => {
		let table = { init: jest.fn(), getId: () => 'table_name' }
		mockTable.mockReturnValueOnce(table)
		Storage.addTable('table_name', 'col1', 'col2')

		expect(() => {
			Storage.addTable('table_name', 'col1', 'col2')
		}).toThrow("Table 'table_name' already exists")
	})

	it('getTable throws when missing', () => {
		expect(() => {
			Storage.getTable('table_name')
		}).toThrow(`Data table 'table_name' does not exist.`)
	})

	it('insert adds data', () => {
		let table = {
			init: jest.fn(),
			getId: () => 'table_name',
			insert: jest.fn().mockReturnValue('res'),
		}
		mockTable.mockReturnValueOnce(table)
		Storage.addTable('table_name', 'col1', 'col2')
		Storage.insert('table_name', 6, 9)
		expect(table.insert).toHaveBeenLastCalledWith([6, 9])
		expect(mockSendStorage).toHaveBeenLastCalledWith('res')
	})

	it('insert throws when table is missing', () => {
		expect(() => {
			Storage.insert('table_name', 6, 9)
		}).toThrow(`Data table 'table_name' does not exist.`)
	})
})
