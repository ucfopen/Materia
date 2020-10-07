Namespace('Materia.Storage').Manager = (() => {
	const _tables = []

	// Adds a StorageTable to the currently managed list of tables. StorageTables
	// are used to store arbitrary information pertaining to a Widget.
	// @id The name of the table to insert (used to insert to it later)
	// @columns The names of the columns for this table
	const addTable = (tableName, ...columns) => {
		let table
		try {
			getTable(tableName)
		} catch (error) {
			table = Materia.Storage.Table()
			table.init(tableName, columns)
			_tables.push(table)
		} finally {
			if (table == null) {
				throw new Error(`Table '${tableName}' already exists`)
				return false
			}
			return true
		}
	}

	// Inserts a row into the the table with the given ID. Make sure the number
	// of arguments after tableId matches the number of columns that belong to this
	// table
	// @param tableId The name of the table to insert the values to
	// @param values The values to insert to the table
	const insert = (tableName, ...values) => {
		const tableId = clean(tableName)
		const table = getTable(tableId)
		if (table == null) {
			// throw error if not found
			throw new Error(`Data table '${tableId}' does not exist.`)
			return null
		}
		// Insert the row into the appropriate table
		const result = table.insert(values)
		Materia.Engine.sendStorage(result)
	}

	var getTable = (tableId) => {
		tableId = clean(tableId)
		// Search for the Table
		// can't use array.find here due to IE11
		for (var i = _tables.length - 1; i >= 0; i--) {
			let table = _tables[i]
			if (table.getId() === tableId) {
				return table
			}
		}

		throw new Error(`Data table '${tableId}' does not exist.`)
		return null
	}

	var clean = (name) => {
		name = String(name)
		let cleanName = name
			.replace(/^([ ]+)/, '')
			.replace(/\s+$/g, '')
			.replace(/\s/g, '_')

		// cant use .contains due to IE11
		if (['userName', 'firstName', 'lastName', 'timestamp', 'playID'].indexOf(cleanName) !== -1) {
			throw new Error(`Column name "${name}" is a protected keyword`)
		}

		return cleanName
	}

	return {
		addTable,
		clean,
		insert,
		getTable,
	}
})()
