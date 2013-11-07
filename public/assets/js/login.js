$(document).ready(function(){

	// hide the labels initially
	$("#username_label").hide();
	$("#password_label").hide();

	timeOut = setTimeout(checkInput, 150);

	// event handler for when one of the input boxes changes
	function checkInput()
	{
		window.clearTimeout(timeOut);
		
		// find the inputs and if they have an autocomplete value filled
		if ($("#username").val() === "")
		{
			$("#username_label").css({ opacity: 0.6 });
			$("#username_label").fadeIn('fast');
		}
		if ($("#password").val() === "")
		{
			$("#password_label").css({ opacity: 0.6 });
			$("#password_label").fadeIn('fast');
		}
	}

	$("label").inFieldLabels();

	$('.available_time').each(function()
	{
		var prevHTML = $(this).html();
		$(this).html( Materia.Set.DateTime.fixTime( parseInt(prevHTML), $('.server_date').html() ) );
	});
});