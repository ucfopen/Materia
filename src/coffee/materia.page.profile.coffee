# do some initial setup stuff... hide things
$(document).ready ->
	$("#activity_grid_noscores").hide()

	$(".profile h3").addClass('loading')

	Materia.Profile.Activity.Load.init(API_LINK)

	Materia.Profile.Activity.Load.getLogs ->
		$(".profile h3").removeClass('loading')

