Namespace('Materia').TextFilter = do ->
	MAX_ANIMATED_ITEMS = 100
	searchDelay = null
	searchDelayTimeoutId = null
	lastSearch = ''

	clearHighlights = ($targetElements) ->
		$targetElements.find('.highlighted').replaceWith -> this.innerHTML

	#Highlights the text
	highlight = (searchString, selector) ->
		if searchString == '' then return yes

		found = no
		terms = searchString.split ' '
		multipleTerms = terms.length > 1
		$(selector).find(".searchable").each ->
			$this = $(this)
			html = $this.html()
			lowercaseHtml = html.toLowerCase()

			# we run a simplier (faster) algorithm for single terms:
			if(!multipleTerms)
				index = lowercaseHtml.indexOf terms[0]
				if index > -1
					$this.html html.substring(0, index)+"<span class='highlighted'>#{html.substring(index, index+terms[0].length)}</span>#{html.substring(index+terms[0].length)}"
					found = yes
			else
				indicies = []
				allTermsMatch = yes
				for term in terms
					index = lowercaseHtml.indexOf term
					if index > -1
						indicies.push [index, index+term.length]
					else
						break
				if indicies.length > 0 && allTermsMatch
					indicies = simplifyIndicies indicies
					len = indicies.length
					newHtml = ''
					for i in [0..len - 1]
						newHtml += html.substring  (if i == 0 then 0 else indicies[i-1][1]), indicies[i][0]
						newHtml +="<span class='highlighted'>#{html.substring(indicies[i][0], indicies[i][1])}</span>"
						if i == len-1 then newHtml += html.substring indicies[i][1]
					$this.html newHtml
					found = yes

		found

	# Joins given pairs of numbers if they overlap into a single number pair
	# given a pair of indicies such as [(2,5),(3,6)] will return a "simplified"
	# set of indicies (i.e. [(2,6)])
	simplifyIndicies = (indicies) ->
		pair = []
		newIndicies = []
		stackNumber = 0
		openIndex = 0

		for index in indicies
			start = index[0]
			end = index[1]

			if pair[start]? pair[start]++
			else pair[start] = 1

			if pair[end]? then pair[end]--
			else pair[end] = -1

		for val, i in pair
			if val?
				if(stackNumber == 0) then openIndex = i
				stackNumber += val
				if(stackNumber == 0) then newIndicies.push([openIndex, i])

		newIndicies.sort (a, b) ->
			if a[0] < b[0] then return -1
			if a[0] > b[0] then return 1
			return 0

		newIndicies

	search = (searchValue, whatToSearch, animationType) ->
		searchValue = $.trim(searchValue.toLowerCase().replace(/,/g, ' '))
		hits = []
		misses = []
		$whatToSearch = $(whatToSearch)

		clearHighlights($whatToSearch)
		$whatToSearch.each ->
			if highlight searchValue, $(this) then hits.push this
			else misses.push this

		renderSearch($(hits), $(misses), animationType)

		return hits

	clearSearch = (whatToSearch, animationType) ->
		search('', whatToSearch, animationType)

	# animationType = 'fade', 'slide', 'hide', 'quick'
	renderSearch = ($hits, $misses, animationType) ->
		unless animationType? then animationType = 'hide'

		if($hits.length + $misses.length > MAX_ANIMATED_ITEMS)
			animationType = 'quick'

		switch(animationType)
			when 'fade'
				$hits.fadeTo 200,(-> zebraStripe()), 1
				$misses.fadeTo 200,( -> zebraStripe()), 0.2
			when 'slide'
				$hits.slideDown 'fast', ->zebraStripe()
				$misses.slideUp 'fast', -> zebraStripe()
			when 'quick'
				$hits.css('display', 'block')
				$misses.css('display', 'none')
				zebraStripe()
			when 'nozebra' # non-zebra striping default, for score table
				$hits.slideDown('fast')
				$misses.slideUp('fast')
			when 'hide' # intentional fall-through
			else
				$hits.show()
				$misses.hide()
				zebraStripe()

	zebraStripe = ->
		odd = no

		$('.widget_list')
			.children(':visible')
				.removeClass('odd')
				.each ->
					$this = $(this)
					if $(this).get(0).nodeName != 'H2'
							odd = !odd
							if odd then $this.addClass('odd')

	# sets up event handlers to make an input field work
	# (add/close button, ESC)
	setupInput = (input, callback, _searchDelay) ->
		$element = $(input)

		unless callback?
			callback = $.noop
		unless _searchDelay?
			searchDelay = 0
		else
			searchDelay = _searchDelay

		# add close x
		$closeX = $('.search-close')
		$closeX.hide()
		$closeX.click (event) ->
			#clear out the search field and force the search to re-run
			$element.val('').trigger('keyup')
			$(this).hide()

		# key listener:
		$element.keyup (event) ->
			val = $element.val()
			if val != lastSearch
				clearTimeout(searchDelayTimeoutId)

				if searchDelay == 0 || val.length == 0
					callback(val)
				else
					searchDelayTimeoutId = setTimeout ->
						callback(val)
					, searchDelay
			else if event.keyCode == 27
				#clear out the search field and force the search to re-run
				val = ''
				$element.val(val).trigger('keyup')

			if val.length != 0
				$closeX.show()
			else
				$closeX.hide()

			lastSearch = val

	highlight: highlight
	clearHighlights: clearHighlights
	search : search
	clearSearch: clearSearch
	renderSearch: renderSearch
	setupInput : setupInput
	zebraStripe: zebraStripe