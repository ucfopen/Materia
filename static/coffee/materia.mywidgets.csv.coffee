Namespace('Materia.MyWidgets').Csv = do ->
	# Holds the semesters picked key == value
	#An array for the sort function to use, ordering the semesters
	semesterArray = ['Spring', 'Summer', 'Fall']
	#An object to hold the scored broken up by semester
	# A boolean to check and see if the current semester is being shown.
	# var currentSemester = false
	inst_id = null
	chosenSemesters = null

	init = (gateway) ->

	# Builds the inital version of the popup window
	buildPopup = ->
		$('.csv_popup').hide()
		getScores($('.gameSelected').attr('id').split('_')[1])
		$('.download_options').css
			left : $('.csv_popup').outerWidth true
		$('.show_options').click (e) ->
			e.preventDefault()
			showOptions()
		$('#checkall').click -> checkAllToggle(this)
		$('.csv_popup').fadeIn()

	# Finds all the scores with a given game instance id
	# @param int the game instance id
	getScores = (gameId) ->
		inst_id = gameId
		# The "check all" first child li
		$dontChange = $('.download_options ul li:first-child')
		# The template for the semester options
		$change = $dontChange.next()

		Materia.Coms.Json.send 'score_summary_get', [inst_id], (summary) ->
			# For each semester, clone the template row
			for s in summary
				$cloned = $change.clone()
				label = s.year+' '+s.term
				id = s.year+'_'+s.term
				$cloned
					.children('input')
						.attr('value', label) # Make the value of the checkbox the semester
						.attr('id', id)
					.end()
					.children('label')
						.html(label) # Fill the span with the semester text
						.attr('for', id)
				# Add it before the template li
				$change.before $cloned
				$cloned.children('input').click -> AddRemoveSemesterToggle this

			# After the list is built, automatically select the latest semester
			$dontChange.next().children('input').trigger 'click'

			# Remove the template li
			$change.remove()
			# If there's only one semester, get rid of "check all" and disable their ability to uncheck the semester
			if $('.semester').length == 1
				$('.semester').attr 'disabled', 'disabled'
				$dontChange.remove()

			AddRemoveSemesterToggle()

	# Checks or unchecks all of the semesters
	# @param object the element that handles the check all
	checkAllToggle = (element) ->
		$element = $(element)
		if $element.is ':checked'
			$element.next().html ' - Uncheck all'
			$('.semester:not(:checked)').each ->
				$(this).trigger 'click'
				AddRemoveSemesterToggle this
		else
			$('.semester:checked').each ->
				$(this).trigger 'click'
				AddRemoveSemesterToggle this
			$element.next().html ' - Check all'

	# Adds or removes a semester from the chosenSemester object
	# @param object the clicked element
	AddRemoveSemesterToggle = (element) ->
		chosenSemesters = []
		$.each $('input.semester:checked'), -> chosenSemesters.push $(this).val()
		updateScoreHeader()

		# toggle the download button
		enableDownload(chosenSemesters.length > 0)

	# Updates the header above the scores table
	updateScoreHeader = ->
		#An array to sort the object
		h4text = []
		
		#fill the array
		h4text.push semester for semester in chosenSemesters
			
		#Sort the array based on year and the semeseter array
		h4text.sort (a,b) ->
			asplit = a.split ' '
			bsplit = b.split ' '
			if asplit[0] - bsplit[0] == 0
				return semesterArray.indexOf(asplit[1]) - semesterArray.indexOf bsplit[1]
			else
				return asplit[0] - bsplit[0]
		# Reverse the array so oldest first
		h4text.reverse()
		# Handle gluing the text
		switch
			when h4text.length > 2
				lastItem = h4text.pop()
				h4text = h4text.join ', '
				h4text += " and #{lastItem}"
			when h4text.length == 2
				h4text = h4text.join ', '
			when h4text.length > 0
				h4text = h4text[0]
			else
				h4text = "(None Selected)"

		$('.download_wrapper h4').html h4text

	showOptions = ->
		$('.download_options').show 'slide', direction : 'left'
		$('.show_options')
			.removeClass('show_options')
			.addClass('hide_options')
			.text('Hide')
			.unbind('click')
			.click (e) ->
				e.preventDefault()
				$('.download_options').hide 'slide', direction : 'left'
				$('.hide_options')
					.removeClass('hide_options')
					.addClass('show_options')
					.text('Semesters...')
					.unbind('click')
					.click (e) ->
						e.preventDefault()
						showOptions()

	# Sets the download buttons href
	# @param boolean turn the download button on or off
	enableDownload = (enable) ->
		if enable
			$('#popup.csv_popup p.download a')
				.removeClass('disabled')
				.attr('href', "/scores/csv/#{inst_id}/#{chosenSemesters.join(',').replace(/\s/g, '-')}")
				.click(-> window.location = $(this).attr 'href')
			$('#popup.csv_popup p.raw a')
				.attr('href', "/scores/raw/#{inst_id}/#{chosenSemesters.join(',').replace(/\s/g, '-')}")
				.click(-> window.location = $(this).attr 'href')
		else
			$('#popup.csv_popup p.download a')
				.addClass('disabled')
				.attr('href', '#')

	init : init
	buildPopup : buildPopup
