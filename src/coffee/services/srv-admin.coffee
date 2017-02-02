app = angular.module('materia')
app.service 'adminSrv', ->

	Materia.Coms.Admin.setGateway '/api/admin/'

	getWidgets = (callback) ->
		Materia.Coms.Admin.send 'GET', 'widgets', null, callback

	saveWidget = (obj, callback) ->
		Materia.Coms.Admin.send 'POST', 'widget', obj, callback

	searchUsers = (str, callback) ->
		Materia.Coms.Admin.send 'GET', 'users', {'search':str}, callback

	lookupUser = (user, callback) ->
		Materia.Coms.Admin.send 'GET', 'user', {'id':user}, callback

	saveUser = (obj, callback) ->
		Materia.Coms.Admin.send 'POST', 'user', obj, callback

	getWidgets: getWidgets
	saveWidget: saveWidget
	searchUsers: searchUsers
	lookupUser: lookupUser
	saveUser: saveUser