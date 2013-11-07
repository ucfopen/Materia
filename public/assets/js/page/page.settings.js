var SAVED_MESSAGE_DISPLAY_DELAY = 1000;

// do some initial setup stuff... hide things
$(document).ready(function()
{
	var die = function()
	{
		alert('There was a problem updating your settings.');
		window.location = window.location;
	};

	var meta = {};
	// we only set values if the user actually changes the inputs.
	$('#notify_on_perm_change').change(function(event) {
		$('.action_button').removeClass('disabled');
		meta.notify_on_perm_change = $('#notify_on_perm_change:checked').length > 0 ? 'on' : 'off';
	});

	$('input[name="avatar"]').change(function(event) {
		$('.action_button').removeClass('disabled');
		meta.avatar = $('input[name="avatar"]:checked').val();
	});

	$('#activate_beard_mode').change(function(event) {
		$('.action_button').removeClass('disabled');
		meta.beardmode = $('#activate_beard_mode:checked').length > 0 ? 'on' : 'off';
	});

	$('.action_button').click(function(event) {
		event.preventDefault();

		if(!$(this).hasClass('disabled'))
		{
			Materia.Set.Throbber.startSpin('.page');

			$.post(
				window.location,
				meta,
				function(data) {
					Materia.Set.Throbber.stopSpin('.page');

					try
					{
						data = $.parseJSON(data);
					}
					catch(e)
					{
						die();
						return;
					}
					if(typeof data !== 'undefined' && typeof data.success !== 'undefined' && data.success === true && typeof data.meta !== 'undefined')
					{
						// check to make sure the saved settings match
						var match = true;
						for(var key in meta)
						{
							if(meta[key] !== data.meta[key])
							{
								die(); return;
							}
						}

						// update avatars on page if needed
						if(typeof meta.avatar !== 'undefined')
						{
							if(typeof data.md5_email !== 'undefined' && data.md5_email.length > 0)
							{
								$('.avatar img').each(function(index, value) {
									var $img = $(this);
									$img.attr('src', 'https://secure.gravatar.com/avatar/' + data.md5_email + '?d=' + data.default_avatar + '&s=' + $img.width());
								});
							}
							else
							{
								$('.avatar img').attr('src', data.default_avatar);
							}
						}

						$('.settingSaveAlert').remove();
						$('.action_button').after('<p class="settingSaveAlert">Settings saved!</p>');

						var saveAlert = $('.settingSaveAlert');
						saveAlert
							.hide()
							.fadeIn()
							.delay(SAVED_MESSAGE_DISPLAY_DELAY)
							.fadeOut(function() {
								saveAlert.remove();

							});
						$('.action_button').addClass('disabled');

						meta = {};
					}
					else
					{
						die();
					}
				}
			);
		}
	});
});