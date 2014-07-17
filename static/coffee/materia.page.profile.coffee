# do some initial setup stuff... hide things
$(document).ready ->
	$("#show_more_activity").hide()

	$("#activity_grid_noscores").hide()

	$(".profile h3").addClass('loading')

	Materia.Profile.Activity.Load.init(API_LINK)

	Materia.Profile.Activity.Load.getLogs ->
		$(".profile h3").removeClass('loading')

	$("#show_more_activity").bind 'click', (e) ->
		e.preventDefault()
		Materia.Profile.Activity.Load.getLogs()

