# TODO: this class is very complex, refactor, maybe breakdown into more methods
Namespace('Materia.MyWidgets').Availability = do ->
	_inst = {}
	_submittedAttempts = null
	_times = {}

	# Validates the avalability info and adds error code
	_parseSubmittedInfo = ->
		success = true
		errors =
			type:[]
			reason:[]

		$('.error').removeClass 'error'
		# For each option checked.
		$('.toFrom li input.availability:checked').each ->
			# Grab the id
			idCheck = $(this).attr 'id'

			# Check the id to see if it has From in it, if so then it's the start date, if not then it's the end date
			startOrEnd = if idCheck.match('From') then 'start' else 'end'
			# Get all of the date info.
			datesParent = $(this).closest '.datePicker'

			dateObj = datesParent.find 'input.date'
			timeObj = datesParent.find 'input.time'
			date = $(dateObj).val()
			time = $(timeObj).val()
			ampm = datesParent.find('.ampm.selected').text()

			# Variables to check that the entered time is in a valid format.
			hourMinute = ['','']
			if (time?)
				hourMinute = time.split(':')

			if hourMinute[0] == ''
				hourLength = true
			else
				hourLength = hourMinute[0].length < 3

			if hourMinute[1]?
				if hourMinute[1] == ''
					minuteLength = true
				else
					minuteLength = hourMinute[1].length < 3
			hourBounds = Number(hourMinute[0]) < 13
			minuteBounds = Number(hourMinute[1]) < 60

			if time == ''
				time = if startOrEnd == 'start' then '6:00' else '11:59'
				ampm = if startOrEnd == 'start' then 'am' else 'pm'

			# if the id is anyime, then the times value will be negative one.
			if idCheck.match 'anytime'
				_times[startOrEnd] = -1
			else
				if date == ''
					dateObj.addClass 'error'
					success = false
					if $.inArray('Date', errors.type) < 0
						errors.type.push 'Date'
					if $.inArray('missing', errors.reason) < 0
						errors.reason.push 'missing'

				else if !hourLength or !minuteLength or !hourBounds or !minuteBounds or !time.match /[0-9]{1,2}:[0-9]{2}/
					if $.inArray('Time', errors.type) < 0
						errors.type.push 'Time'

					timeObj.addClass 'error'
					success = false
					if time == '' and $.inArray('missing', errors.reason) < 0
						errors.reason.push 'missing'
					else if $.inArray('invalid', errors.reason) < 0
						errors.reason.push 'invalid'

				else
					fullDate = date+" "+time+ampm
					_times[startOrEnd] = Date.parse(fullDate).getTime()/1000


		if success
			return true
		else
			type = if errors.type.length > 1 then "#{errors.type[0]}s and #{errors.type[1]}s are " else "#{errors.type[0]} is "
			reason = if errors.reason.length > 1 then "#{errors.reason[0]}/#{errors.reason[1]}" else errors.reason[0]
			$('.availabilityError').remove()

			# Options for this error are type(Date is/Time is/Dates and times are) and reason(missing/invalid)
			$('.attemptsPopup').before '<p class="availabilityError">'+type+reason+'</p>'
			false

	# Formats the dates based on the range given
	# @var string none/to/from/toFrom
	# @return array start and end dates
	_dateFormatter = (range) ->
		date = []
		date['start'] = ''
		date['end']   = ''

		startInfo = null
		endInfo = null

		# Finds the times based on the availability text in the selected widget
		# It was a lot easier to do it this way than have to parse javascripts dumb date object (support a 12 hour format, jerks!)
		timeSet   = $('#avaliability').text().match /[0-9]+\/[0-9]+\/[0-9]+ at [0-9]+:[0-9]+(am|pm)/g
		if timeSet?
			if timeSet[0] && range != 'to' # if 'to' is the range, then the first element is the end date
				startInfo = timeSet[0].split ' at '
			if timeSet[1] # if the second element exits, then that is the end date
				endInfo = timeSet[1].split ' at '
			else if range == 'to' # if 'to' is the range, then the first element is the end date.
				endInfo = timeSet[0].split ' at '

		# If start variable exists, then populate the start elements with information
		if startInfo
			date['start'] = startInfo[0]
			$(".date.from").val startInfo[0]
			ampm = startInfo[1].match(/(am|pm)/)[1]
			$('#startTime').val startInfo[1].slice(0, -2)
			$('.start.ampm.'+ampm).trigger 'click'

		# If end variable exists, then populate the end elements with information
		if endInfo
			date['end'] = endInfo[0]
			$(".date.to").val(endInfo[0])
			ampm = endInfo[1].match(/(am|pm)/)[1]
			$('#endTime').val endInfo[1].slice(0, -2)
			$('.end.ampm.'+ampm).trigger 'click'

		# If the time is blured without minutes set, add :00 (so 2 becomes 2:00)
		$(".time").blur ->
			val = $(this).val()
			if !val.match(':') && val < 13 && val != ''
				$(this).val "#{val}:00"
		date

	# Checks the attempts and adds the selected class accordingly
	# @var number the number that attempts is current at
	# @return void
	_checkAttempts = (number) ->
		num = Math.floor number/1000
		if $('.attemptHolder #value_'+num).length > 0
			$('.attemptHolder li.selected').removeClass 'selected'
			$('.attemptHolder #value_'+num).addClass 'selected'
		else if $('#value_'+(num+2)).length > 0 && (num+2) > 4
			$('.attemptHolder li.selected').removeClass 'selected'
			$('.attemptHolder #value_'+(num+2)).addClass 'selected'
		else if $('#value_'+(num-2)).length > 0 && (num-2) > 4
			$('.attemptHolder li.selected').removeClass 'selected'
			$('.attemptHolder #value_'+(num-2)).addClass 'selected'

	# Sets the sliders value to the number specified in ui.
	# @return void
	_setSlider = ->
		idNum = $(".attemptHolder li.selected").attr('id').split('_')[1]
		attemptsValue = $(".selected").html()
		realNum = parseInt(idNum, 10)*1000
		$( ".selector" ).slider 'value', realNum
		$('#valueHolder').html attemptsValue
		_submittedAttempts = parseInt(idNum)
		_submittedAttempts = -1 if _submittedAttempts == 25
		return

	# Handles the api calls to actually change the availability
	# @return void
	_changeAvailability = (callback) ->
		# Update the widget instance.
		Materia.Widget.saveWidget
			inst_id: _inst.id,
			open_at: _times['start'],
			close_at: _times['end'],
			attempts: _submittedAttempts
			, (widget) ->
			# Repopuplates the availability and attempts on the main page
			Materia.MyWidgets.SelectedWidget.populateAvailability _times['start'], _times['end']
			Materia.MyWidgets.SelectedWidget.populateAttempts parseInt(_submittedAttempts, 10)
			callback()

	init = (gateway) ->

	popup = ->
		# Gets the game id for use in the api
		gameId = $('.gameSelected').attr('id').split('_')[1]

		Materia.WidgetInstance.get gameId, (inst) ->
			_inst = inst
			# The values are huge for smooth slidyness
			$('.selector').slider
				value: if _inst.attempts < 0 then 25000 else _inst.attempts * 1000
				min: 1000
				max: 25000
				create: (event) ->
					ui = {}
					ui.value = if _inst.attempts < 0 then 25000 else _inst.attempts * 1000
					_checkAttempts ui.value
					_setSlider()
				slide: (event, ui) ->
					_checkAttempts ui.value
				stop: (event, ui) ->
					_setSlider()

			# Checks the range of the dates (which dates are chosen)
			switch
				when _inst.close_at < 0 && _inst.open_at < 0 then range = 'none'
				when _inst.open_at < 0 && _inst.close_at > 0 then range = 'to'
				when _inst.open_at > 0 && _inst.close_at < 0 then range = 'from'
				else
					range = 'toFrom'

			$('.start.ampm').add($('.end.ampm')).click ->
				$this = $(this)
				if $this.is('.pm')
					$this.addClass('selected')
					$this.parent().children('.am').removeClass('selected')
				else
					$this.addClass('selected')
					$this.parent().children('.pm').removeClass('selected')

			# Gets the start/end dates based on the range
			date = _dateFormatter(range)

			# Builds the datepickers and sets their start/end dates.
			$(".date.from").datepicker
				maxDate: date['end']
				onSelect: (dateText, inst) ->
					$('.date.to').datepicker 'option', {minDate: dateText}

			$(".date.to").datepicker
				minDate: date['start']
				onSelect: (dateText, inst) ->
					$('.date.from').datepicker 'option', {maxDate: dateText}

			$('.date, .time').click ->
				$(this).closest('.datePicker').find('.specify.availability').trigger 'click'

			# Based on the range, simulates the appropriate clicks.
			switch range
				when 'none'
					$('#anytimeFrom').trigger 'click'
					$('#anytimeTo').trigger 'click'
				when 'to'
					$('#anytimeFrom').trigger 'click'
					$('#specifyTo').trigger 'click'
				when 'from'
					$('#specifyFrom').trigger 'click'
					$('#anytimeTo').trigger 'click'
				when 'toFrom'
					$('#specifyFrom').trigger 'click'
					$('#specifyTo').trigger 'click'

			$('.time').keypress (e) ->
				e.preventDefault() if !Materia.Validate.Textfield.timeOnly(e)

			$(window).keyup (e) ->
				# Escape key to close the popup
				if e.keyCode == 27
					$(window).unbind 'keyup'
					$.jqmodal 'close'
			# So when you click on a number, it sets the slider to that number.
			$('.attemptHolder li').click ->
				clickedAmount = $(this).attr('id').split('_')[1]*1000
				$('.selector').slider 'value', clickedAmount
				_checkAttempts clickedAmount
				_setSlider()

			$('.save').click (e) ->
				console.log "click saved!"
				e.preventDefault()
				_changeAvailability( -> $.jqmodal('close')) if _parseSubmittedInfo()
				false

	init  : init
	popup : popup