Namespace('Materia.Permissions').User = do ->
	REMOVE_SELF_MSG = "Are you sure you want to remove <strong>your</strong> access?"
	DEMOTE_SELF_MSG = "Are you sure you want to limit <strong>your</strong> access?"
	EXPIRE_SELF_MSG = "Are you sure you want to expire <strong>your</strong> access?"
	ACCESS_VALUE_FULL = 30
	SUPER_USER = 90
	ACCESS_VALUE_VIEW_SCORES = 0

	init = (gateway) ->

	showSelfDemotionWarning = ($parent, message, callback) ->
		#@TODO - don't hardcode this here!
		$confirm = $('<div class="demote_dialogue"><div class="arrow"></div><span class="warning">'+message+'</span><a class="button no_button" href="#">No</a><a class="button action_button red yes_button" href="#">Yes</a></div>')
		$pointingTo = $parent.find('img')
		p = $pointingTo.offset()

		$parent.append($confirm)

		p.left += $pointingTo.outerWidth() + 11
		p.top += ($pointingTo.outerHeight() - $confirm.outerHeight()) / 2

		$confirm
			.css('z-index', '10000')
			.css('position', 'absolute')
			.offset(p)

		$confirm.find('.button').click (event) ->
			event.preventDefault()
			$('.demote_dialogue').remove()
		$confirm.find('.no_button').click (event) ->
			event.preventDefault()
			callback(false)
		$confirm.find('.action_button').click (event) ->
			event.preventDefault()
			callback(true)

	getDateForBeginningOfTomorrow = ->
		d = new Date()
		d.setDate(d.getDate() + 1)
		new Date(d.getFullYear(), d.getMonth(), d.getDate())

	getExpirationDateString = (timestamp) ->
		#unless timestamp? then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))
		timestamp = parseInt(timestamp, 10)
		if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))

	# Creates a new collaborator row in the collaboration dialog representing a persons access to a widget
	#
	# @param {Object} collaborator    User object of the collaborator
	# @param {Number} newAccess       Code representing this collaborator's access (30=Full, 0=View Scores)
	# @param {Number} currentAccess   Code representing the current user's access (30=Full, 0=View Scores)
	# @param {Number} expire          null if no date is set, or a unix timestamp of the expiration date
	createCollaboratorRow = (collaborator, newAccess, currentAccess, expire) ->
		defaultAvatarLocation = "?d=#{BASE_URL}assets/img/default-avatar.jpg"
		$row = $('#permdump').clone()
		initialExpirationTimestamp = expire
		$expirationButton = $row.find(".exp-date")

		# define required data values
		$row
			.data('expirationDate', expire)
			.data('user-id', collaborator.id)
			.data('current-user', collaborator.isCurrentUser)
			.data('access', newAccess)

		# fill in row with collaborator details
		$row.attr('id', 'user-' + collaborator.id)
		$row.find('.avatar').attr('src', 'https://secure.gravatar.com/avatar/' + hex_md5(collaborator.email) + defaultAvatarLocation)
		$row.find('.name').html(collaborator.first + ' ' + collaborator.last + ( if collaborator.isCurrentUser then '<span>(You)</span>' else ''))

		# setup event to click X button to remove permissions
		$row.find('.remove').on 'click', (event) ->
			event.preventDefault()
			removeCollaborator(collaborator, $row)

		# setup event to change permissions dropdown
		$row.find('.perm').on 'change', (event) ->
			newAccessValue = parseInt($(this).val(), 10)
			event.preventDefault()
			modifyCollaboratorPermissions(collaborator, newAccessValue, $row)

		updateAccessValueUI($row, newAccess)

		# fill in the expiration link text & setup click event
		$expirationButton.datepicker
			minDate: getDateForBeginningOfTomorrow()
			onSelect: (dateText, inst) ->
				modifyExpiration(collaborator, $(this).datepicker('getDate').getTime() / 1000, $row)

		updateExpirationLinkUI($row, expire)

		# Validates the expiration input box once it's unfocused. If the date is invalid or blank, reset to "Never"
		$expirationButton.focusout (event) ->

			isValidDate = (date) ->
				if date.length <= 0 then return false

				isDate = no
				try
					parsed_date = $.datepicker.parseDate('mm/dd/yy', date)
					isDate = Date.now() < parsed_date
				catch exception
					#nothing
				isDate

			if $(this).val() != "Never" && !isValidDate($(this).val())
				alert('Please enter a valid date.')
				$(this).val('Never')
				event.preventDefault()

		# setup event to click expiration X button to reset expiration to 'never'
		$row.find('.remove-expiration').on 'click', (event) ->
			event.preventDefault()
			modifyExpiration(collaborator, null, $row)
		if (currentAccess != ACCESS_VALUE_FULL and currentAccess != SUPER_USER) then disableRow(collaborator, $row)

		# finally add the element to the dialog
		$('#popup').find('.access_list').append($row)

	# turns off all controls (except allows the ability to remove yourself)
	disableRow = (collaborator, $row) ->
		$row.find('select').prop('disabled', true)
		$row.find('.exp-date')
			.addClass('disabled')
			.datepicker('destroy')

		$row.find('.remove-expiration').hide()
		if(!collaborator.isCurrentUser)
			$row.find('.remove').css('visibility', 'hidden')

	updateExpirationLinkUI = ($row, expiration_date) ->
		$row.find(".exp-date").val(getExpirationDateString(expiration_date))

		if expiration_date?
			$row.find('.remove-expiration').show()
		else
			$row.find('.remove-expiration').hide()

	# Will attempt to remove a collaborator. First shows a confirmation
	# warning if the user is attempting to remove themselves
	removeCollaborator = (collaborator, $row) ->
		removalFunction = (confirmed) ->
			if(confirmed)
				# mark for removal if user was not just added
				index = $.inArray(collaborator.id, $("#popup.share").data("usersToAdd"))
				if(index == -1)
					$("#popup.share").data("usersToRemove").push(collaborator.id)
				else
					$("#popup.share").data("usersToAdd").splice(index, 1)

				$row.fadeOut 'fast', () -> $(this).remove()

		if(!collaborator.isCurrentUser)
			removalFunction(true)
		else
			if ($row.find('.demote_dialogue').length == 0)
				showSelfDemotionWarning($row, REMOVE_SELF_MSG, removalFunction)

	# Will attempt to modify a collaborator's permissions. First shows a
	# confirmation warning if the user is demoting themselves
	modifyCollaboratorPermissions = (collaborator, newAccessValue, $row) ->
		modifyFunction = (accessValue) ->
			$row.data('access', accessValue)
			updateAccessValueUI($row, accessValue)

		if(!(collaborator.isCurrentUser && newAccessValue == ACCESS_VALUE_VIEW_SCORES))
			modifyFunction(newAccessValue)
		else
			showSelfDemotionWarning $row, DEMOTE_SELF_MSG, (confirmed) ->
				# If the user has confimed the demotion we set the access to the
				# new level, otherwise we revert back to full. This can be
				# redundant, but it will reset the dropdown to the desired value
				# since the act of changing it was already done at this point.
				modifyFunction(confirmed ? newAccessValue : ACCESS_VALUE_FULL)

	updateAccessValueUI = ($row, accessValue) ->
		accessValue = parseInt(accessValue, 10)
		$row.find('select option[value="' + accessValue + '"]').attr('selected', 'selected')

	modifyExpiration = (collaborator, newExpirationTimestamp, $row) ->
		modifyFunction = (expirationTimestamp) ->
			$row.data('expirationDate', expirationTimestamp)
			updateExpirationLinkUI($row, expirationTimestamp)

		if(!(collaborator.isCurrentUser && newExpirationTimestamp != null && ($row.data('expirationDate') == null || !$row.data('expirationDate'))))
			modifyFunction(newExpirationTimestamp)
		else
			showSelfDemotionWarning $row, EXPIRE_SELF_MSG, (confirmed) ->
				modifyFunction(confirmed ? newExpirationTimestamp : null)

	search = (nameOrFragment) ->
		Materia.Set.Throbber.startSpin '.search_list',
			withDelay: false
			withBackground: false
			absolute: false

		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		if(nameOrFragment.length < 1)
			stopSpin()
			return
		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->
			if(matches == null || typeof matches == 'undefined' || matches.length < 1)
				noMatchMsg = "The person you're searching for may need to log in to create an account."
				$('#popup .search_list').html("<p class='no_match_message'>No matches found.</p>")
				$('#popup .search_list .no_match_message').after("<p class='no_match_reason'>"+noMatchMsg+"</p>")
				stopSpin()
				return

			matchesHolder = $("<div></div>")

			for user in matches
				#match = $("#matchdump").clone()
				match = $('<div><img class="user_match_avatar" src=""></img><p class="user_match_name"></p></div>')

				$(match).attr('id','match_user_'+user.id)
				$(match).addClass('search_match')
				$(match).attr('tabindex',0)
				gravatar = 'https://secure.gravatar.com/avatar/'+hex_md5(user.email)+'?d=' + BASE_URL + 'assets/img/default-avatar.jpg'
				$(match).find('.user_match_avatar').attr('src',gravatar)
				$(match).find('.user_match_email').attr('value',user.email)
				$(match).find('.user_match_name').html(user.first + " " + user.last)

				$.data(match[0],"info",{id: user.id, first:user.first, last:user.last, email: user.email})
				matchesHolder.append(match)

				if(matches.length == 1)
					$(match).css('background-color','#7fc9f3')

			$('#popup .search_list').empty()
			matchesHolder.children().each ->
				$new_perm = this
				$('#popup .search_list').append($new_perm)

			$("#popup").tablock("reset")
			$('.search_match').click(searchMatchClick)
			targetIndex = -1
			searchList = $('#popup .search_list').children()

			$('#popup.share').keyup (e) ->
				if(e.which >= 37 && e.which <= 40) #arrow keys
					e.preventDefault()
					targetIndex = $.inArray(searchList[targetIndex],searchList)

					switch e.which
						when 37 #left arrow
							if targetIndex > -1
								targetIndex--
							else
								stopSpin()
								return
						when 38 #up arrow
							if(targetIndex < 2)
								$('#popup .user_add').focus()
								targetIndex = -1
								stopSpin()
								return
							else
								targetIndex-=2
						when 39  #right arrow
							if(targetIndex > -1)
								targetIndex++
							else
								stopSpin()
								return
						when 40 #down arrow
							if(targetIndex == -1)
								targetIndex = 0
							else
								targetIndex+=2

					$(searchList[targetIndex]).focus()

				else if(e.which == 13) #enter
					if (searchList.length == 1)
						$(searchList[0]).click()
					else if (searchList.length > 1)
						$(searchList[targetIndex]).click()
			stopSpin()

	stopSpin = ->
		Materia.Set.Throbber.stopSpin('.search_list')

	searchMatchClick = ->
		clickedMatch = $(this)[0]
		info = $.data(clickedMatch, "info")
		selectedUsers = $('#popup #access .access_list .user_perm')
		popup_data = $('#popup.share').data()

		for user in selectedUsers
			if(user.id.split('-')[1] == info.id)
				alert("This user already has access to this widget.")
				# clear input field and hide slider -- should be moved to a function
				$('#popup .user_add').val("")
				$('#popup .search_list').empty().slideUp(50)
				return

		newDiv = $('<input class="share_user_to_add" type="button" value="'+info.first+" "+info.last+'"/>')

		$(newDiv).click ->
			lastHeight = $('#popup  #input_area').height()
			$(this).remove()
			if($('#popup  #input_area').height() != lastHeight)
				Permissions.User.repositionSearchWindow()
		# add the new user
		popup_data.usersToAdd.push(info.id)

		$('.search_match').remove()

		$('.user_add').val("")
		$('#popup .search_list').hide()
		$('#popup .adding_shadow').hide()

		Materia.Permissions.Widget.buildPermsList()

	repositionSearchWindow = ->
		addPos = $('#popup .user_add').offset()
		addPosHeight = $('#popup .user_add').height()
		$('#popup .search_list').offset({left: addPos.left, top: addPos.top+addPosHeight})

	updatePerms = (permObj, onSuccessCallback) ->
		cleanID = $('.gameSelected').attr('id').split("_")[1]

		$("#popup.share").addClass('loading')

		Materia.Coms.Json.send 'permissions_set', [0,cleanID,permObj], (returnData) ->
			if (typeof returnData.type != 'undefined' && returnData.type == "warn")
				alert(returnData.msg)
				$("#popup.share").removeClass('loading')
			else
				#close the module by clicking the cancel button
				$("#popup.share .cancel_button").click()
				onSuccessCallback() if(onSuccessCallback != undefined)

	init                    : init
	createCollaboratorRow   : createCollaboratorRow
	search                  : search
	repositionSearchWindow  : repositionSearchWindow
	updatePerms             : updatePerms
