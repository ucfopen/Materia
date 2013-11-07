// do some initial setup stuff... hide things
$(document).ready(function()
{
	$("#show_more_activity").hide();

	$("#activity_grid_noscores").hide();

	$(".profile h3").addClass('loading');
	//$(".activity_grid").addClass('loading');

	Materia.Profile.Activity.Load.init(API_LINK);

	Materia.Profile.Activity.Load.getLogs(function() {
		$(".profile h3").removeClass('loading');
	});

	$("#show_more_activity").bind('click', function(e)
	{
		e.preventDefault();
		Materia.Profile.Activity.Load.getLogs();	
	});
});