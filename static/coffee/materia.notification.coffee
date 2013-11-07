Namespace('Materia').Notification = do ->
	init = (gateway) ->

	getNotifications = ->
		Materia.Coms.Json.send 'notifications_get', null, (notifications) ->
			displayNotifications(notifications) if $.isArray(notifications)
			return false
		,
		true

	checkForOverflow = ->
		holder = $('#notices')[0]
		if !$.data holder, 'info'
			$.data holder, 'info', last:0
		if holder.clientWidth < holder.scrollWidth
			$(holder).css 'padding-right', holder.scrollWidth-holder.clientWidth
		else if holder.clientWidth != $.data(holder, 'info').last
			$(holder).css 'padding-right', 0
		$.data holder, 'info', last:holder.clientWidth

	displayNotifications = (notifications) ->
		return if notifications.msg && notifications.msg.title == 'Invalid Login'

		areaHeight = $(window).height()-$('header').height()
		$('#notices').css 'max-height',areaHeight
		$('#notices').hide()
		num = notifications.length

		return if num == 0

		$('#notifications_link').show()
		$('#notifications_link').attr 'data-notifications', num
		$('#notifications_link').click ->
			if $(this).hasClass 'selected'
				$('#notices').slideUp ->
					$('#notifications_link').removeClass 'selected'
					if ie8Browser?
						$('#swfplaceholder').hide()
						$('object').css 'visibility', 'visible'
			else
				$object = $('object')
				if ie8Browser?
					$('#swfplaceholder').show() if $('#swfplaceholder').length > 0
					$object.css 'visibility', 'hidden'
				$('#notifications_link').addClass 'selected'
				$('#notifications_link').show()
				$('#notices').children().fadeIn()
				$('#notices').slideDown -> checkForOverflow()

		$noticeSrc = $($('#t-notification').html())
		for note in notifications
			$notice = $noticeSrc.clone()
			$notice.removeAttr 'id'
			$.data $notice[0], 'info', {id:note.id}

			$notice.find('.senderAvatar').attr 'src', note.avatar
			$notice.find('.subject').html note.subject

			$notice.find('.noticeClose').click ->
				noteID = $.data($(this).parent()[0], 'info').id
				Materia.Coms.Json.send 'notification_delete', [noteID]
				$(this).parent().slideUp ->
					$(this).remove()
					$('#notifications_link').attr 'data-notifications', $('#notices').children().length
					checkForOverflow()
					if $('#notices').children().length == 0
						$('#notices').remove()
						$('#notifications_link').removeClass 'selected'
						$('#notifications_link').hide()

				false
			$('#notices').append $notice
			$($notice).hide()

	init				: init,
	checkForOverflow	: checkForOverflow,
	getNotifications	: getNotifications