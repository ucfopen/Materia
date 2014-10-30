Namespace('Materia.Store').Spotlight = do ->
	spotlightArray = null

	init = (gateway) ->

	get = (callback) ->
		Materia.Coms.Json.send 'widget_spotlight_get', null, (data) ->
			spotlightArray = data
			populateSpotlight -> if callback then callback()

	populateSpotlight = (callback) ->
		for spotlight, i in spotlightArray
			hide = ''
			checked = ''
			if i != 0 then hide = 'hidden'
			else checked = 'checked="checked"'
			$('.main_container').append('<article class="store_main '+hide+'" id="spolight_'+i+'" >'+spotlight+'</article>')
			$('.cycler').append('<input type="radio" name="spotlight" id="slide_'+i+'" '+checked+' class="radio_spotlight" />')

		if callback then callback()

	init : init
	get  : get