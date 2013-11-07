Namespace('Materia.Profile.Activity').Load = do ->
	_offset = 0
	_user_id = null

	init = (gateway) ->

	# Executes the API function and an optional callback function
	# @param   callback	optional callback
	getLogs = (callback) ->
		$('#activity_logs_loading').show()

		#Gets current user
		Materia.Coms.Json.send 'user_get', null, (user) ->
			_user_id = user.id if _user_id?
			Materia.Coms.Json.send 'play_activity_get', [_offset], (data) ->
				_showPlayActivity data
				callback() if callback?

	# Shows selected game information on the mainscreen.
	# @param   data   Score data sent back from the server
	_showPlayActivity = (data) ->
		# hide the template, show the list
		$('.activity > ul').show()

		# show/hide the "More" button depending if there's more to see
		$('#activity_logs_loading').hide()

		if data.activity.length == 0
			$('.no_logs').show()
		else
			$('#show_more_activity').show()

		$('#show_more_activity').hide() if data.more != true


		for play in data.activity
			$activityLink = $('#activity_logs_template').clone()
			$activityLink.removeAttr('id')
				.removeClass('activity_logs_template')
				.addClass( if play.percent == '100'  then 'perfect_score' else '')
				.addClass( if play.is_complete == '1' then 'complete' else 'incomplete')
				.find('.title')
					.html(play.inst_name)
					.end()
				.find('.date')
					.html(
						Materia.Set.DateTime.parseObjectToDateString(play.created_at) +
						' at ' +
						Materia.Set.DateTime.fixTime(parseInt(play.created_at, 10)*1000, DATE)
					)
					.end()
				.find('.score')
					.html( if play.is_complete == '1' then Math.round(parseFloat(play.percent)) else '--')
					.end()
				.find('.widget')
					.html(play.widget_name)
					.end()
				.find('.status')
					.html( if play.is_complete == '1' then '' else 'No Score Recorded')

			if(play.is_complete == '0') # allow int and string
				$activityLink.find('.score-link').removeAttr 'href'
			else
				$activityLink.find('.score-link').attr 'href', "#{BASE_URL}scores/#{play.inst_id}#play-#{play.play_id}"

			$activityLink.appendTo $('.activity > ul')
			_offset++

	init: init,
	getLogs: getLogs