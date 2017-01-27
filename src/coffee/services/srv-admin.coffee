app = angular.module('materia')
app.service 'adminSrv', ->

	Materia.Coms.Admin.setGateway '/api/admin/'

	getWidgets = (callback) ->
		Materia.Coms.Admin.send 'widgets_get', [], callback

	saveWidget = (obj, callback) ->
		Materia.Coms.Admin.send 'widget_update', [obj], callback

	searchUsers = (str, callback) ->
		Materia.Coms.Admin.send 'users_search', [str], callback

	lookupUser = (user, callback) ->
		Materia.Coms.Admin.send 'user_lookup', [user], callback

	saveUser = (obj, callback) ->
		Materia.Coms.Admin.send 'user_save', [obj], callback

	getWidgets: getWidgets
	saveWidget: saveWidget
	searchUsers: searchUsers
	lookupUser: lookupUser
	saveUser: saveUser