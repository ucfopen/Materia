describe('multiword filter', function () {
	var filter
	let widgetList = [{ searchCache: 'text to search' }, { searchCache: 'other stuff to search' }]

	beforeEach(() => {
		filter = testGetFilter('multiword')
	})

	it('exist', () => {
		expect(filter).not.toBeUndefined()
		expect(filter).not.toBeNull()
	})

	it('should find matches', () => {
		expect(filter(widgetList, 'stuff')).toMatchObject([widgetList[1]])
		expect(filter(widgetList, 'text')).toMatchObject([widgetList[0]])
		expect(filter(widgetList, 'text search')).toMatchObject([widgetList[0]])
		expect(filter(widgetList, 'to search')).toMatchObject(widgetList)
	})

	it('should allow an unused third argument of AND', () => {
		expect(filter(widgetList, 'stuff', 'AND')).toMatchObject([widgetList[1]])
		expect(filter(widgetList, 'text', 'AND')).toMatchObject([widgetList[0]])
	})

	it('return everything with no search term', () => {
		expect(filter(widgetList, '')).toMatchObject(widgetList)
		expect(filter(widgetList, '', 'AND')).toMatchObject(widgetList)
	})
})
