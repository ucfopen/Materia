# Namespace function for defining namespaces
app = angular.module 'materia', ['ngModal']
app.config ($sceDelegateProvider) ->
	$sceDelegateProvider.resourceUrlWhitelist [ STATIC_CROSSDOMAIN + "**", BASE_URL + "**" ]

window.API_LINK = '/api/json/'

window.isMobile =
	Android: -> navigator.userAgent.match(/Android/i)
	BlackBerry: -> navigator.userAgent.match(/BlackBerry/i)
	iOS: -> navigator.userAgent.match(/iPhone|iPad|iPod/i)
	Opera: -> navigator.userAgent.match(/Opera Mini/i)
	Windows: -> navigator.userAgent.match(/IEMobile/i)
	any: -> (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows())

# this code ensures that Opera runs onload/ready js events when navigating foward/back.
# http://stackoverflow.com/questions/10125701/
if history?.navigationMode?
	history.navigationMode = 'compatible'

$(document).ready ->
	konami = ''

	$(document).keydown (e) ->
		switch e.which
			when 38
				konami += 'up'
			when 40
				konami += 'down'
			when 37
				konami += 'left'
			when 39
				konami += 'right'
			when 66
				konami += 'b'
			when 65
				konami += 'a'
			else
				konami = ''

		if konami == 'upupdowndownleftrightleftrightba'
			beards = ['dusty_full', 'black_chops', 'grey_gandalf', 'red_soul']

			$icon = $('.icon')
			meta = {}
			if($icon.hasClass('bearded'))
				meta.beardmode = 'off'
				BEARD_MODE = false

				$('link[href="/assets/css/beard_mode.css"]').remove()

				$('.icon').removeClass('bearded')
				$('.icon_container').removeClass('big_bearded')

				$('.widget .icon').each (index) ->
					for j in [0...beards.length]
						if $(this).hasClass('small_'+beards[j])
							$(this).removeClass('small_'+beards[j])

						if $('.icon_container').hasClass('med_'+beards[j])
							$('.icon_container').removeClass('med_'+beards[j])
			else
				meta.beardmode = 'on'
				BEARD_MODE = true
				$('link:last').after('<link rel="stylesheet" href="/assets/css/beard_mode.css" type="text/css" data-src="page" />')

				# my widgets
				$('.widget .icon').addClass('bearded')
				$('.icon_container').addClass('big_bearded')
				$('.widget .icon').each (index) ->
					rand = Math.floor((Math.random()*beards.length)+1) - 1

					$(this).addClass('small_'+beards[rand])

					if ($(this).parent().hasClass('gameSelected'))
						$('.icon_container').addClass('med_'+beards[rand])
			$.post('/settings', meta)
			konami = ''
