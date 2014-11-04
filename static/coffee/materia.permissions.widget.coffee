Namespace('Materia.Permissions').Widget = do ->
	init = (gateway) ->

	buildPermsList = ->
		expiration_bridge = []

		$('#popup .access_list div.user_perm').each ->
			existing_user_id = parseInt($(this).data('user-id'))
			expiration_bridge[existing_user_id] = $(this).data('expirationDate')

		$('#popup .access_list').empty()

		selectedGame = $('.gameSelected').attr('id').split('_')[1]
		popup_data = $('#popup.share').data()
		access_list = {}
		user_ids = []
		found = -1
		id = -1

		Materia.User.getCurrentUser (current_user) ->
			Materia.Coms.Json.send 'permissions_get', [0,selectedGame], (permInfo) ->
				perms = permInfo['widget_user_perms']
				accessLevel = Number(permInfo['user_perms'][current_user.id][0])

				if (accessLevel == 0)
					$("#popup.share .access_list").addClass('no-add-access')
					$("#popup.share .cancel_button").html('Close')
					$("#popup.share .input_label").remove()
					$("#popup.share .user_add").remove()

				if(typeof(popup_data.usersToAdd) == 'undefined')
					popup_data.current_user_access = accessLevel
					popup_data.usersToAdd = []
					popup_data.usersToRemove = []

				# account for adding back an existing user after removing that user
				for id of popup_data.usersToRemove
					if((found = $.inArray(popup_data.usersToRemove[id], popup_data.usersToAdd)) != -1)
						popup_data.usersToRemove.splice(id, 1)
						popup_data.usersToAdd.splice(found, 1)

				# add existing users to the access list
				for user_id of perms
					# do not add existing user if marked for removal
					if($.inArray(user_id, popup_data.usersToRemove) != -1)
						continue
					access_list[user_id] = perms[user_id]
					user_ids.push(user_id)

				# add all of the new users to the access list
				for i of popup_data.usersToAdd
					id = popup_data.usersToAdd[i]
					access_list[id] = [0,null]
					user_ids.push(id)

				# if there is no one to display, just return
				if(user_ids.length == 0)
					return

				Materia.Coms.Json.send 'user_get', [user_ids], (users) ->
					users.sort (a,b) ->
						if(a.first < b.first || (a.first == b.first && a.last < b.last) || (a.last == b.last && a.middle < b.middle))
							return -1
						return 1

					$('body').append("<div id='permdump'></div>")
					$perm_temp = $("#permdump")
					$perm_temp.addClass("user_perm")

					$perm_temp.append($('#t-share-person').html())

					onlyUser = (users.length == 1)

					for i of users
						collaborator = users[i]
						collaboratorAccess = parseInt(access_list[collaborator.id][0], 10)
						collaboratorExpirationTimestamp = if expiration_bridge[collaborator.id]? then expiration_bridge[collaborator.id] else access_list[collaborator.id][1]
#@TODO
						Materia.Permissions.User.createCollaboratorRow(collaborator, collaboratorAccess, accessLevel, collaboratorExpirationTimestamp)
					$perm_temp.remove()
					$("#popup").tablock("reset")

	saveAndClose = ->
		Materia.Set.Throbber.startSpin '#popup'

		Materia.User.getCurrentUser (current_user) ->
			inst_id = $('.gameSelected').attr('id').split("_")[1]
			allUserPerms = []
			collaboration_count = 0

			popup_data = $('#popup.share').data()
			usersToRemove = popup_data.usersToRemove
			usersToAdd = popup_data.usersToAdd

			# delete self?
			delete_self = ($.inArray(current_user.id, usersToRemove) != -1)

			# users with view only permissions can remove self
			if popup_data.current_user_access == 0
				if delete_self
					# update user's permissions and
					Materia.Permissions.User.updatePerms [{user_id:current_user.id, expiration:null, perms:[false]}], ->
						Materia.MyWidgets.Sidebar.removeWidget inst_id
				Materia.Set.Throbber.stopSpin '#popup'
				return

			# add permissions for new & existing users
			$("#popup.share .user_perm").each ->
				p = $(this).data()

				# exclude current user and expired users from collaboration count
				if !p.currentUser && !(p.expirationDate != null && p.expirationDate*1000 < new Date().valueOf())
					collaboration_count++

				userPerm = {}
				userPerm['user_id'] = p.userId
				userPerm['expiration'] = p.expirationDate
				userPerm['perms'] = []
				userPerm['perms'][p.access] = true

				allUserPerms.push userPerm

			# add permissions for users to remove
			for user in usersToRemove
				allUserPerms.push {user_id:user, expiration:null, perms:[false]}

			# update all users permissions and hide the widget if user removed himself
			Materia.Permissions.User.updatePerms allUserPerms, ->
				Materia.Set.Throbber.stopSpin '#popup'
				if(delete_self)
					Materia.MyWidgets.Sidebar.removeWidget inst_id
					return

			# update collaboration link count
			str = 'Collaborate'
			str += " (#{collaboration_count})" if collaboration_count > 0
			$('#share_widget_link').text str

	init            : init
	buildPermsList  : buildPermsList
	saveAndClose    : saveAndClose
