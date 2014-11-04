$(document).ready ->
	return if not Materia.Notification

	Materia.Notification.init(API_LINK)

	if $('header').hasClass('logged_in')
		Materia.Notification.getNotifications()

	Materia.Permissions.User.init(API_LINK)
	Materia.Permissions.Widget.init(API_LINK)

	$(document).on 'click', '.notice .close', (event) ->
		event.preventDefault()
		$('.notice').slideToggle(150)

	# when the transfer ownership button is pressed
	$(document).on 'click', '.owner a', (e) ->
		e.preventDefault()

		Materia.Permissions.Widget.transferView()

