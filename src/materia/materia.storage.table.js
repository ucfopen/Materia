Namespace('Materia.Storage').Table = () => {
	let _id = null
	let _columns = []
	let _rows = []

	// Creates a new StorageTable for storing data to the server.
	// StorageTables are built to slightly mimic the functionality of database tables.
	// @param id The name of this StorageTable
	// @param columns The names of each of the columns for this table
	const init = (id, columns) => {
		_id = Materia.Storage.Manager.clean(id)
		_columns = []
		_rows = []
		columns.forEach((c) => {
			_columns.push(Materia.Storage.Manager.clean(c))
		})
	}

	// Inserts a new row into this table.
	// @param values The values to insert into the table. Make sure the number
	// of arguments passed match the number of columns pertaining to this table.
	const insert = (values) => {
		// Make sure arguments match number of columns
		if (values.length !== _columns.length) {
			throw new Error(
				`StorageTable '${_id}' requires ${_columns.length} value(s) and received ${values.length}`
			)
			return
		}

		// Create the row to add to the list of rows
		const result = {}

		for (let i in values) {
			const value = values[i]
			result[_columns[i]] = String(value)
		}

		_rows.push(result)
		// Send this row to the server
		return {
			name: _id,
			data: result,
		}
	}

	const getValues = () => {
		return _rows.slice()
	}

	const getId = () => _id

	return {
		getId,
		init,
		insert,
		getValues,
	}
}
