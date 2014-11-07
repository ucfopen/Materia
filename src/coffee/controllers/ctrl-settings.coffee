app = angular.module 'materia'
app.controller 'settingsController', ($scope) ->
	SAVED_MESSAGE_DISPLAY_DELAY = 1000

	# do some initial setup stuff... hide things
	$(document).ready ->
		die = ->
			alert('There was a problem updating your settings.')
			window.location = window.location

		meta = {}

		# we only set values if the user actually changes the inputs.
		$('#notify_on_perm_change').change (event) ->
			$('.action_button').removeClass('disabled')
			meta.notify_on_perm_change = $('#notify_on_perm_change:checked').length > 0 ? 'on' : 'off'

		$('input[name="avatar"]').change (event) ->
			$('.action_button').removeClass('disabled')
			meta.avatar = $('input[name="avatar"]:checked').val()

		$('#activate_beard_mode').change (event) ->
			$('.action_button').removeClass('disabled')
			meta.beardmode = $('#activate_beard_mode:checked').length > 0 ? 'on' : 'off'

		$('.action_button').click (event) ->
			event.preventDefault()

			if !$(this).hasClass('disabled')
				Materia.Set.Throbber.startSpin('.page')

				$.post window.location,
					meta,
					(data) ->
						Materia.Set.Throbber.stopSpin('.page')

						try
							data = $.parseJSON(data)
						catch e
							die()
							return

						if data?.success? == true and data?.meta?
							# check to make sure the saved settings match
							match = true
							for key in meta
								if  meta[key] isnt data.meta[key]
									die()
									return

							# update avatars on page if needed
							if meta.avatar?
								if data.md5_email?.length > 0
									$('.avatar img').each (index, value) ->
										$img = $(this)
										$img.attr('src', 'https://secure.gravatar.com/avatar/' + data.md5_email + '?d=' + data.default_avatar + '&s=' + $img.width())
								else
									$('.avatar img').attr('src', data.default_avatar)

							$('.settingSaveAlert').remove()
							$('.action_button').after('<p class="settingSaveAlert">Settings saved!</p>')

							saveAlert = $('.settingSaveAlert')
							saveAlert
								.hide()
								.fadeIn()
								.delay(SAVED_MESSAGE_DISPLAY_DELAY)
								.fadeOut ->
									saveAlert.remove()
							$('.action_button').addClass('disabled')

							meta = {}
						else
							die()


