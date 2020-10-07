describe('Materia.Storage.Table', () => {
	let Table
	let mockTable
	let mockSendStorage

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./materia.storage.manager')
		require('./materia.storage.table')
		Table = Materia.Storage.Table()
	})

	it('defines expected public methods', () => {
		expect(Table.init).toBeDefined()
		expect(Table.getId).toBeDefined()
		expect(Table.insert).toBeDefined()
		expect(Table.getValues).toBeDefined()
	})

	it('init cleans its id and columns', () => {
		Table.init(`<-OE3 49*@#/'"`, [`De '"k2*()`, `+$_';]{)DFnkld  fj`])
		Table.insert([1, 2])
		let vals = Table.getValues()
		expect(vals[0]).toHaveProperty('De_\'"k2*()', '1')
		expect(vals[0]).toHaveProperty("+$_';]{)DFnkld__fj", '2')
	})

	it('init prevents columns of special names', () => {
		expect(() => {
			Table.init(`t`, [`userName`, 'whatever'])
		}).toThrow(`Column name "userName" is a protected keyword`)

		expect(() => {
			Table.init(`t`, ['happy', `firstName`])
		}).toThrow(`Column name "firstName" is a protected keyword`)

		expect(() => {
			Table.init(`t`, ['go go', `lastName`])
		}).toThrow(`Column name "lastName" is a protected keyword`)

		expect(() => {
			Table.init(`t`, [`timestamp`])
		}).toThrow(`Column name "timestamp" is a protected keyword`)

		expect(() => {
			Table.init(`t`, [`playID`, 'timestamp'])
		}).toThrow(`Column name "playID" is a protected keyword`)
	})

	it('iinsert errors col length doesnt match', () => {
		Table.init('t1', ['col1', 'col2'])

		expect(() => {
			Table.insert([1, 2, 3])
		}).toThrow(`StorageTable 't1' requires 2 value(s) and received 3`)
	})
})
