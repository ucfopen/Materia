Namespace('Materia.Storage').Manager = do ->

	_tables = []

	# Adds a StorageTable to the currently managed list of tables. StorageTables
	# are used to store arbitrary information pertaining to a Widget.
	# @id The name of the table to insert (used to insert to it later)
	# @columns The names of the columns for this table
	addTable = ->
		id = arguments[0]
		columns = []
		for i in [1..arguments.length-1]
			columns.push(arguments[i])
		# Search for a duplicate
		for table in _tables
			if table.getId() is clean(id)
				break
		# Create the table or throw error if duplicate
		unless table?
			newTable = Materia.Storage.Table()
			newTable.init(clean(id), columns)
			_tables.push(newTable)
		else
			throw new Error("Table '${id}' already exists")

	# Inserts a row into the the table with the given ID. Make sure the number
	# of arguments after tableId matches the number of columns that belong to this
	# table
	# @param tableId The name of the table to insert the values to
	# @param values The values to insert to the table
	insert = ->
		tableId = arguments[0]
		values = []
		for i in [1..arguments.length-1]
			values.push(arguments[i])
		# Search for the Table
		for table in _tables
			if table.getId() is clean(tableId)
				break
		unless table? # throw error if not found
			throw new Error("Data table '#{tableId}'' does not exist.")
			return null
		# Insert the row into the appropriate table
		result = table.insert(values)

		Materia.Engine.sendStorage(result)

	getTable = (tableID) ->
		# Search for the Table
		for i in [1.._tables.length-1]
			table = _tables[i]
			if table.getId() is StorageTable.clean(tableID)
				break
		unless table?
			throw new Error("Data table '#{tableID}' does not exist.")
			return null
		table

	clean = (name) ->
		cleanName = name.replace(/^([ ]+)/, '')
		cleanName = cleanName.replace(/\s+$/g, '')
		cleanName = cleanName.replace(/\s/g, '_')

		if cleanName in ['userName', 'firstName', 'lastName', 'timestamp', 'playID']
			throw new Error('Column name "'+name+'" is a protected keyword')

		cleanName

	addTable : addTable
	clean    : clean
	insert   : insert
	getTable : getTable