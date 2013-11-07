Namespace('Materia.Store').SlideShow = do ->
	formatCycler = (callback) ->
		selected = ' spotlight_selected'
		$('.cycler').children('input').each ->
			$(this).hide()
			$(this).after('<span class="span_next'+selected+'"></span>')
			selected = ''
		cyclerWidth = $('.span_next').outerWidth(true) * $('.span_next').length
		$('.cycler').width(cyclerWidth)
		intervalID = setInterval(spotlightChange, 12000)
		$('.span_next').click ->
			if($(this).hasClass('spotlight_selected')) then return false
			clearInterval(intervalID)
			spotlightSelected($(this))
			num = $(this).prev().attr('id').split('_')
			num = num.pop()
			goToSlide(num)

	goToSlide = (slideNo) ->
		showing = $('.main_container').children(':visible')
		id = showing.attr('id')
		changeTo = $("#spolight_"+slideNo)
		changeToId = changeTo.attr('id')
		
		num = id.split('_').pop()
		changeNum = changeToId.split('_').pop()
		
		if num > changeNum
			showing.hide('slide', {direction : 'right', speed: 'slow'})
			changeTo.show('slide', {direction : 'left', speed: 'slow'})
		else
			showing.hide('slide', {direction : 'left', speed: 'slow'})
			changeTo.show('slide', {direction : 'right', speed: 'slow'})
	
	# Changes the spotlight to the next one in the list
	spotlightChange = ->
		# Checks to see if the next child is hidden (won't be if it's the last child in the list)
		if $('.main_container').children(':visible').next().is(':hidden')
			# Stores the object to get around the jquery-ui wrappers.
			obj = $('.main_container').children(':visible')
			# Stores the object that needs to be shown.
			nextObj = $('.main_container').children(':visible').next()
			obj.hide('slide', {direction : 'left', speed: 'slow'})
			nextObj.show('slide', {direction : 'right', speed: 'slow'})
			
			# Spits the id so the buttons know which one needs to be highlighted.
			num = nextObj.attr('id').split('_')
			num = num.pop()
			
			# Sends that button
			spotlightSelected($("#slide_"+num).next())
		# This does the same as above except it gets the first child (hits if the element is the last in the list).
		else
			$('.main_container').children(':visible').hide('slide', {direction : 'right', speed: 'slow'})
			obj = $('.main_container').children(':first-child')
			$('.main_container').children(':first-child').show('slide', { direction : 'left', speed: 'slow'})
			num = obj.attr('id').split('_')
			num = num.pop()
			spotlightSelected($("#slide_"+num).next())

	# Cycles thorough the buttons to remove all selected clases, then adds the selected class to the button specified and checks that buttons input.
	spotlightSelected = (button) ->
		$('.cycler').children('span').each -> $(this).removeClass('spotlight_selected')
		button.addClass('spotlight_selected').prev().attr('checked', 'checked')

	formatCycler : formatCycler,