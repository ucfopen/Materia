Namespace('Materia.Storage').Manager = do ->

	_tables = []

	# Adds a StorageTable to the currently managed list of tables. StorageTables
	# are used to store arbitrary information pertaining to a Widget.
	# @id The name of the table to insert (used to insert to it later)
	# @columns The names of the columns for this table
	addTable = (tableName, columns...) ->
		try
			getTable tableName
		catch error
			table = Materia.Storage.Table()
			table.init tableName, columns
			_tables.push table
		finally
			unless table?
				throw new Error "Table '#{tableName}' already exists"
				return false
			return true

	# Inserts a row into the the table with the given ID. Make sure the number
	# of arguments after tableId matches the number of columns that belong to this
	# table
	# @param tableId The name of the table to insert the values to
	# @param values The values to insert to the table
	insert = (tableName, values... ) ->
		tableId = clean tableName
		table = getTable tableId
		unless table? # throw error if not found
			throw new Error("Data table '#{tableId}'' does not exist.")
			return null
		# Insert the row into the appropriate table
		result = table.insert values
		Materia.Engine.sendStorage result

	getTable = (tableId) ->
		tableId = clean(tableId)
		# Search for the Table
		for table in _tables
			return table if table.getId() is tableId
			
		throw new Error "Data table '#{tableId}' does not exist."
		return null

	clean = (name) ->
		name      = String(name)
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