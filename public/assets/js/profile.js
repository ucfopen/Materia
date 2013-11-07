// do some initial setup stuff... hide things
$(document).ready(function()
{
	$("#show_more_activity").hide();

	$("#activity_grid_noscores").hide();

	$(".profile h3").addClass('loading');
	//$(".activity_grid").addClass('loading');

	Profile.Activity.init(API_LINK);
	Profile.Graph.init(API_LINK);

	Profile.Activity.getLogs(function() {
		$(".profile h3").removeClass('loading');
	});

	$("#show_more_activity").bind('click', function(e)
	{
		e.preventDefault();
		Profile.Activity.getLogs();	
	});
});