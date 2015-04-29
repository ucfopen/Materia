Namespace('Materia.Set').Availability = do ->

	populate = (startDateInt, endDateInt, element) ->
		startDateInt = parseInt(startDateInt, 10)
		endDateInt = parseInt(endDateInt, 10)

		if endDateInt > 0
			endDate = Materia.Set.DateTime.parseObjectToDateString(endDateInt)
			endTime = Materia.Set.DateTime.parseTime(endDateInt)

		if startDateInt > 0
			open_at = Materia.Set.DateTime.parseObjectToDateString(startDateInt)
			startTime = Materia.Set.DateTime.parseTime(startDateInt)

		if endDateInt < 0 && startDateInt < 0
			$(element).removeAttr('data-type')
			$(element).html("Anytime")
		else if startDateInt < 0 && endDateInt > 0
			$(element).attr('data-type', 'endDateOnly')
			$(element).html('Open until <span class="available-date">'+endDate+'</span> at <span class="available-time">'+endTime+'</span>')
		else if startDateInt > 0 && endDateInt < 0
			start = new Date(startDateInt)
			$(element).attr('data-type', 'startDateOnly')
			$(element).html('Anytime after <span class="available-date">'+open_at+'</span> at <span class="available-time">'+startTime+'</span>')
		else
			start = new Date(startDateInt)
			end = new Date(endDateInt)
			$(element).removeAttr('data-type')
			$(element).html('From <span class="available-date">'+open_at+'</span> at <span class="available-time">'+startTime+'</span> until <span class="available-date">'+endDate+'</span> at <span class="available-time">'+endTime+'</span>')

	get = (startDateInt, endDateInt) ->
		startDateInt = parseInt(startDateInt, 10)
		endDateInt = parseInt(endDateInt, 10)

		if endDateInt > 0
			endDate = Materia.Set.DateTime.parseObjectToDateString(endDateInt)
			endTime = Materia.Set.DateTime.parseTime(endDateInt)
		else
			endDate = endTime = 0

		if startDateInt > 0
			open_at = Materia.Set.DateTime.parseObjectToDateString(startDateInt)
			startTime = Materia.Set.DateTime.parseTime(startDateInt)
		else
			open_at = startTime = 0

		start:
			date:open_at
			time:startTime
		end:
			date:endDate
			time: endTime

	populate : populate,
	get : get
