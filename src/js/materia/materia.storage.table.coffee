Namespace('Materia.Storage').Table = ->

	_id = null
	_columns = []
	_rows = []

	# Creates a new StorageTable for storing data to the server.
	# StorageTables are built to slightly mimic the functionality of database tables.
	# @param id The name of this StorageTable
	# @param columns The names of each of the columns for this table

	init = (id, columns) ->
		_id = Materia.Storage.Manager.clean(id)
		_columns = []
		_rows = []
		for name in columns
			_columns.push Materia.Storage.Manager.clean(name)
		null

	# Inserts a new row into this table.
	# @param values The values to insert into the table. Make sure the number
	# of arguments passed match the number of columns pertaining to this table.

	insert = (values) ->
		# Make sure arguments match number of columns
		if values.length is not _columns.length
			throw new Error("StorageTable '#{_id}' requires #{_columns.length} value(s) and received #{arguments.length}")
			return

		# Create the row to add to the list of rows
		result = {}

		for i, value of values
			result[_columns[i]] = String(value)

		_rows.push(result)
		# Send this row to the server
		name: _id
		data: result

	getValues = ->
		values = []
		for row in _rows
			values.push(row)
		values

	getId = ->
		_id

	getId     : getId
	init      : init
	insert    : insert
	getValues : getValues
