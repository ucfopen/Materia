Namespace('Materia.Sorter').Filter = do ->
	filter = (programSort) ->
		#Defines the elements which should be shown, if nothing is selected, then everything should be shown.
		contains = '.widgetMin'
		#Contains the elements that should be hidden.
		notcontains = ''
		programName = programSort.val()
		#Defaines the "select one" option of the dropdown
		defaultProgram = programSort.children("option:first-child").val()

		#Goes thrhough each feature to check for a check.
		$('.features dt input[type="checkbox"]:checked').each (event) ->
			contains += ":contains('"+$(this).val()+"')"
			notcontains += ".widgetMin:not(:contains('"+$(this).val()+"')), "

		#Goes though each supported data option to check for a check.
		$('.features .supported-data input[type="checkbox"]:checked').each (event) ->
			contains += ":contains('"+$(this).val()+"')"
			notcontains += ".widgetMin:not(:contains('"+$(this).val()+"')), "

		#Hides elements that should be hidden.
		$(notcontains).fadeTo('fast', 0.2)
		#Shows elements that should be shown.
		$(contains).fadeTo('fast', 1)

	# sort can optionally take an array of jQuery widget elements.
	sort = (widgets, sortType, callback) ->
		unless widgets? then widgets = $('.widgets .widget')

		sortedData = widgets.sorted('by': (v) -> return $(v).find('h1').text().toLowerCase())
		appendWidgets(sortedData)

	appendWidgets = (sortedData) ->
		$widgets = $('.widgets')
		for data in sortedData
			$widgets.append(data)

	widgetSearch = (searchValue, section) ->
		found = false
		pattern = new RegExp(searchValue, "i")
		$(section).find(".searchable").each ->
			repl = /<span class=[\'|\"]{1}highlighted[\'|\"]>([^<]*)<\/span>/i
			if($(this).html().match(repl) != null)
				$(this).html($(this).html().replace(repl, '$1'))
			matches = $(this).html().match(pattern)
			if($(this).html().match(pattern) != null && searchValue != '')
				$(this).html($(this).html().replace(pattern, "<span class='highlighted'>"+matches+"</span>"))
				found = true
			else if (searchValue == '')
				found = true
		return found

	textSearch = (searchValue) ->
		$(".widgets").children('section').each ->
			found = testSearch(searchValue, $(this))
			if found == false then $(this).fadeTo(1, .2)
			else $(this).fadeTo(1, 1)

	filter: filter,
	sort: sort,

